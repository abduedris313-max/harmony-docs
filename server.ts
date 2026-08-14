import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import * as jose from "jose";
import { parsePdfToMarkdown } from "./src/utils/pdfEngine";

dotenv.config();

const app = express();
const PORT = 3000;

// Read Firebase Project ID for token verification
let FIREBASE_PROJECT_ID = "concrete-lead-kc9s2";
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (rawConfig.projectId) {
      FIREBASE_PROJECT_ID = rawConfig.projectId;
    }
  }
} catch (e) {
  console.warn("Could not read firebase-applet-config.json:", e);
}

// Google JWKS for Firebase Auth token validation
const JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyAuthHeader(req: express.Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return {
      uid: payload.sub as string,
      email: payload.email as string | undefined,
    };
  } catch (err) {
    return null;
  }
}

// Support larger PDF base64 payloads up to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Structured Telemetry Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api/")) {
      console.log(
        JSON.stringify({
          type: "telemetry_access_log",
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
          userId: (req as any).user?.uid || "anonymous",
          timestamp: new Date().toISOString(),
        })
      );
    }
  });
  next();
});

// Attach user authentication context
app.use(async (req, res, next) => {
  const user = await verifyAuthHeader(req);
  (req as any).user = user;
  next();
});

// Phase 1: Security Rate Limiters
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many API requests from this IP. Please try again later." },
});

const heavyAiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit reached for heavy document AI processing. Please wait 1 minute before submitting another request." },
});

app.use("/api/", generalApiLimiter);
app.use(
  ["/api/convert-pdf", "/api/stream-convert", "/api/refine-markdown", "/api/stream-refine", "/api/generate-summary"],
  heavyAiLimiter
);

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
  const user = (req as any).user;
  res.json({
    status: "ok",
    message: "PDF to Markdown Converter API is running",
    authenticated: !!user,
    user: user || null,
  });
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
        model: "gemini-3.7-flash",
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

// Phase 2: Stream PDF Conversion over SSE
app.post("/api/stream-convert", async (req, res) => {
  try {
    const { pdfBase64, options = {}, engine = "pdf_engine" } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF file data provided." });
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(cleanBase64, "base64");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write(`data: ${JSON.stringify({ stage: "parsing", progress: 20, message: "Analyzing PDF text streams and layout geometry..." })}\n\n`);

    const {
      preserveLayout = true,
      extractTables = true,
      extractImagesDesc = true,
      mathLatex = true,
      cleanHeadersFooters = true,
      pageRange = "All",
      languageHint = "Auto",
    } = options;

    if (engine === "gemini_ai" || engine === "ai") {
      res.write(`data: ${JSON.stringify({ stage: "ai_vision", progress: 40, message: "Processing with Gemini AI multi-lingual OCR..." })}\n\n`);

      const systemPrompt = `You are an expert document parser and layout compiler converting PDF to Markdown.`;
      const ai = getGeminiClient();

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: cleanBase64 } },
            { text: `Convert this PDF document to clean Markdown.` },
          ],
        },
        config: { systemInstruction: systemPrompt, temperature: 0.2 },
      });

      let accumulated = "";
      for await (const chunk of responseStream) {
        if (chunk.text) {
          accumulated += chunk.text;
          res.write(`data: ${JSON.stringify({ stage: "streaming", progress: 75, chunk: chunk.text })}\n\n`);
        }
      }

      const wordCount = accumulated.trim().split(/\s+/).filter(Boolean).length;
      res.write(`data: ${JSON.stringify({
        stage: "complete",
        progress: 100,
        done: true,
        markdown: accumulated,
        stats: { wordCount, charCount: accumulated.length, lineCount: accumulated.split("\n").length }
      })}\n\n`);
      res.end();
    } else {
      res.write(`data: ${JSON.stringify({ stage: "native_parse", progress: 60, message: "Extracting tables, LaTeX math, and structured hierarchy..." })}\n\n`);

      const markdown = await parsePdfToMarkdown(pdfBuffer, {
        preserveLayout,
        extractTables,
        cleanHeadersFooters,
        pageRange,
        mathLatex,
      });

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

      const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
      const charCount = markdown.length;
      const lineCount = markdown.split("\n").length;

      res.write(`data: ${JSON.stringify({
        stage: "complete",
        progress: 100,
        done: true,
        markdown,
        detectedLanguage,
        direction,
        engine: "Native PDF Engine",
        stats: { wordCount, charCount, lineCount },
      })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Error in /api/stream-convert:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to stream convert PDF." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Streaming conversion error" })}\n\n`);
      res.end();
    }
  }
});

// Generate bulleted Key Takeaways Summary endpoint
app.post("/api/generate-summary", async (req, res) => {
  try {
    const {
      markdown,
      bulletCount = 4,
      style = "bulleted",
      focusArea = "general",
      customInstructions = "",
    } = req.body;

    if (!markdown || !markdown.trim()) {
      return res.status(400).json({ error: "No Markdown content provided." });
    }

    let styleInstruction = "";
    switch (style) {
      case "executive":
        styleInstruction = "High-level strategic executive summary with high-impact findings, business or organizational implications, and core metrics.";
        break;
      case "actionable":
        styleInstruction = "Action-oriented takeaways focusing on key recommendations, actionable steps, next milestones, and practical conclusions.";
        break;
      case "technical":
        styleInstruction = "Deep technical takeaways highlighting architecture, specifications, technical methodology, and quantitative findings.";
        break;
      case "concise":
        styleInstruction = "Ultra-concise, punchy bullet points capturing the absolute core essence in minimal words.";
        break;
      default:
        styleInstruction = "Comprehensive, balanced takeaways highlighting the main concepts, findings, and takeaways.";
    }

    const systemPrompt = `You are a world-class AI document analyst and synthesiser specializing in distilling complex documents into crisp, impactful, and scannable 'Key Takeaways' sections in Markdown.

Your task:
Analyze the provided Markdown document and generate a pristine '## Key Takeaways' section.

Rules:
1. Begin immediately with the heading: ## Key Takeaways
2. Generate approximately ${bulletCount} distinct bullet points.
3. Each bullet point MUST start with a bold category or theme tag followed by a colon and a clear, substantive synthesis statement.
   Example format:
   - **[Core Finding/Topic]**: [Insightful and specific synthesis of the document's point]
4. Emphasize key facts, metrics, decisions, conclusions, or critical arguments.
5. Tone & Style: ${styleInstruction}
${focusArea && focusArea !== "general" ? `6. Specific Focus Area: ${focusArea}` : ""}
${customInstructions ? `7. Additional Instructions: ${customInstructions}` : ""}
8. Output ONLY the raw Markdown block (starting with ## Key Takeaways). Do not add preamble, greeting, or conversational introductory text.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { text: `Synthesize this document into a bulleted Key Takeaways section:\n\n${markdown}` },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.25,
      },
    });

    const keyTakeawaysMarkdown = response.text || "";

    res.json({
      success: true,
      takeawaysMarkdown: keyTakeawaysMarkdown,
    });
  } catch (error: any) {
    console.error("Error in /api/generate-summary:", error);
    res.status(500).json({
      error: error.message || "Failed to generate Key Takeaways summary with AI.",
    });
  }
});

// Refine or format existing Markdown endpoint (Standard)
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
      model: "gemini-3.7-flash",
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

// Phase 2: Stream AI Refinement over SSE Endpoint
app.post("/api/stream-refine", async (req, res) => {
  try {
    const { markdown, action, customPrompt, targetLanguage } = req.body;

    if (!markdown || !markdown.trim()) {
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

    // Set SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const ai = getGeminiClient();

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.7-flash",
      contents: [
        { text: prompt },
        { text: `--- DOCUMENT START ---\n${markdown}\n--- DOCUMENT END ---` },
      ],
      config: {
        temperature: 0.3,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Error in /api/stream-refine:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to stream refine Markdown." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Streaming error occurred" })}\n\n`);
      res.end();
    }
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

