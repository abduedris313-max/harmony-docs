import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { parsePdfToMarkdown } from "./src/utils/pdfEngine";

dotenv.config();

const app = express();
const PORT = 3000;

// Support larger PDF base64 payloads up to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Gemini client to prevent crash if key is missing on startup
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PDF to Markdown Converter API is running" });
});

// Convert PDF to Markdown endpoint
app.post("/api/convert-pdf", async (req, res) => {
  try {
    const { pdfBase64, options = {}, engine = "pdf_engine" } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF file data provided." });
    }

    // Clean base64 string if data URL scheme is present
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(cleanBase64, "base64");

    const {
      preserveLayout = true,
      extractTables = true,
      extractImagesDesc = true,
      mathLatex = true,
      cleanHeadersFooters = true,
      pageRange = "All",
      languageHint = "Auto",
    } = options;

    let markdown = "";

    if (engine === "gemini_ai" || engine === "ai") {
      // Optional AI conversion path
      const systemPrompt = `You are an expert document parser and document layout compiler specializing in converting PDF documents into clean, elegant, and accurately structured Markdown format. You natively support all languages and scripts, with full fidelity for Arabic (RTL, right-to-left layout, cursive letter joining, diacritics), Amharic (Ethiopic/Ge'ez script), English, French, Spanish, German, Chinese, Japanese, and others.
      
LANGUAGE OCR & SCRIPT HINT: ${
        languageHint && languageHint !== "Auto"
          ? `The document is hinted to be in ${languageHint}. Ensure 100% precision for ${languageHint} characters, letter joining, right-to-left flow for Arabic, and Ethiopic glyph preservation for Amharic.`
          : "Automatically detect the primary language and script of the PDF (Arabic, Amharic, English, etc.). Preserve exact characters, Unicode normalization, and script directionality."
      }

Conversion Guidelines:
1. Preserve original text accuracy, Unicode characters, and language scripts without stripping, reversing, or corrupting non-ASCII characters. For Arabic, maintain proper letter joining and right-to-left text ordering.
2. Preserve structural hierarchy accurately using Markdown headers (#, ##, ###, ####).
${extractTables ? "3. Extract and format tables into valid GitHub Flavored Markdown (GFM) tables using clean | pipes | and alignment dividers |---|." : "3. Convert table data into clear structured text lists."}
${preserveLayout ? "4. Maintain list structures, bullet points, numbered lists, blockquotes, code blocks, and emphasis (bold, italic)." : "4. Simplify text formatting into standard paragraphs and headers."}
${mathLatex ? "5. Represent mathematical formulas, LaTeX symbols, and equations clearly using $...$ or $$...$$." : "5. Represent formulas in clear plain text."}
${extractImagesDesc ? "6. If figures, diagrams, charts, or images are present in the PDF, insert descriptive alt tags and captions, e.g. ![Diagram: Description of chart/figure]." : "6. Skip image details and focus on text."}
${cleanHeadersFooters ? "7. Omit repetitive running headers, footers, page numbers, and page margin artifacts unless they are part of document content." : "7. Preserve all header/footer text as inline blocks."}
8. Return ONLY the final converted Markdown text. Do NOT wrap the Markdown in an outer triple-backtick markdown code block unless the converted PDF itself is a code file.`;

      const ai = getGeminiClient();
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64,
        },
      };
      const textPart = {
        text: `Convert this PDF document into structured Markdown according to these requested options:
- Primary Language Hint: ${languageHint}
- Page Range: ${pageRange}
- Format Tables: ${extractTables}
- Preserve Structural Layout: ${preserveLayout}
- LaTeX/Math Notation: ${mathLatex}
- Image Descriptions: ${extractImagesDesc}
- Omit Repetitive Headers/Footers: ${cleanHeadersFooters}

Provide a complete, well-formatted, readable Markdown document representation of the PDF content.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: [pdfPart, textPart] },
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      markdown = response.text || "";
    } else {
      // Native PDF Engine (pdf-parse & deterministic layout compiler)
      markdown = await parsePdfToMarkdown(pdfBuffer, {
        preserveLayout,
        extractTables,
        cleanHeadersFooters,
        pageRange,
        mathLatex,
      });

      if (!markdown || !markdown.trim()) {
        markdown = "# Converted PDF Document\n\n*(No readable text streams detected in this PDF or document is scanned images)*";
      }
    }

    // Detect language and direction from converted output
    const arabicCount = (markdown.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const amharicCount = (markdown.match(/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/g) || []).length;
    
    let detectedLanguage = "English / Standard";
    let direction: "rtl" | "ltr" = "ltr";

    if (arabicCount > 5) {
      detectedLanguage = "Arabic (العربية)";
      direction = "rtl";
    } else if (amharicCount > 5) {
      detectedLanguage = "Amharic (አማርኛ)";
      direction = "ltr";
    }

    // Calculate document statistics
    const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
    const charCount = markdown.length;
    const lineCount = markdown.split("\n").length;

    res.json({
      success: true,
      markdown,
      detectedLanguage,
      direction,
      engine: engine === "gemini_ai" || engine === "ai" ? "Gemini AI Engine" : "Native PDF Engine",
      stats: {
        wordCount,
        charCount,
        lineCount,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/convert-pdf:", error);
    res.status(500).json({
      error: error.message || "Failed to convert PDF to Markdown using PDF engine.",
    });
  }
});

// Refine or format existing Markdown endpoint
app.post("/api/refine-markdown", async (req, res) => {
  try {
    const { markdown, action, customPrompt, targetLanguage } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: "No Markdown content provided." });
    }

    let prompt = "";
    switch (action) {
      case "summarize":
        prompt = "Provide a concise executive summary followed by key bulleted takeaways derived from this Markdown document. Preserve valid Markdown formatting.";
        break;
      case "grammar":
        prompt = "Proofread, fix grammatical issues, improve readability, and polish the style of this Markdown document. Retain original Markdown tags and hierarchy.";
        break;
      case "format_tables":
        prompt = "Locate any unformatted, ASCII, or raw text tables in this document and align/convert them into pristine GitHub Flavored Markdown (GFM) tables.";
        break;
      case "extract_action_items":
        prompt = "Extract all key tasks, action items, deadlines, and responsibilities into a Markdown task checklist (- [ ] task).";
        break;
      case "translate":
        prompt = `Translate the entire Markdown document accurately into ${targetLanguage || "Spanish"}, maintaining all Markdown structure, headings, code blocks, and formatting intact.`;
        break;
      case "custom":
        prompt = customPrompt || "Improve and reformat this Markdown document.";
        break;
      default:
        prompt = "Clean up formatting and improve presentation of this Markdown text.";
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { text: prompt },
        { text: `--- DOCUMENT START ---\n${markdown}\n--- DOCUMENT END ---` },
      ],
      config: {
        temperature: 0.3,
      },
    });

    const refinedResult = response.text || markdown;

    res.json({
      success: true,
      refinedMarkdown: refinedResult,
    });
  } catch (error: any) {
    console.error("Error in /api/refine-markdown:", error);
    res.status(500).json({
      error: error.message || "Failed to refine Markdown.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
