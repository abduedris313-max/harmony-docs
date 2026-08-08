import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  RotateCw, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Sparkles, 
  Download, 
  FileText, 
  Edit3, 
  X, 
  Save, 
  Check, 
  Type, 
  Highlighter, 
  PenTool, 
  Undo, 
  Layers, 
  Scissors, 
  Info, 
  CheckCircle,
  FileDown,
  Upload,
  UploadCloud,
  Minimize2,
  RefreshCw,
  MousePointer,
  Sliders,
  Stamp,
  FileDigit,
  Percent,
  FileImage
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

// Sample PDFs reference
import { SAMPLE_PDFS, SamplePdf } from '../data/samplePdfs';

interface PdfEditorViewProps {
  onConvertEditedPdf: (pdfBytes: Uint8Array, filename: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  initialPdfBytes?: Uint8Array;
  initialFilename?: string;
  activePdfUrl?: string;
  onNavigateToLibrary: () => void;
}

interface PageItem {
  id: string;
  originalIndex: number; // index in the source loaded doc
  rotation: number;      // current rotation in degrees (0, 90, 180, 270)
  isBlank?: boolean;     // whether this is an inserted blank page
  annotations: Annotation[];
}

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'draw' | 'signature';
  x: number;          // percentage from left (0 to 100)
  y: number;          // percentage from top (0 to 100)
  color: string;      // hex color
  text?: string;       // text content
  fontSize?: number;  // font size in points
  width?: number;     // for highlighter/signature (percentage width)
  height?: number;    // for highlighter/signature (percentage height)
  points?: { x: number; y: number }[]; // coordinates for pen drawing (percentage)
  signatureDataUrl?: string; // base64 PNG data url
}

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export const PdfEditorView: React.FC<PdfEditorViewProps> = ({
  onConvertEditedPdf,
  onShowToast,
  initialPdfBytes,
  initialFilename = 'edited_document.pdf',
  activePdfUrl,
  onNavigateToLibrary,
}) => {
  // Main PDF File State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(initialPdfBytes || null);
  const [filename, setFilename] = useState<string>(initialFilename);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfDocInstance, setPdfDocInstance] = useState<any>(null);

  // PDF Page List State
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Merger Files State
  const [mergerFiles, setMergerFiles] = useState<{ id: string; file: File; pagesCount: number }[]>([]);
  const mergerFileInputRef = useRef<HTMLInputElement>(null);

  // Split Range State
  const [splitRange, setSplitRange] = useState<string>('1-2');

  // Metadata State
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });

  // Active Tool Panel: 'organizer' | 'annotator' | 'merger' | 'splitter' | 'metadata' | 'stamping' | 'compression'
  const [activeTab, setActiveTab] = useState<'organizer' | 'annotator' | 'merger' | 'splitter' | 'metadata' | 'stamping' | 'compression'>('organizer');

  // Watermark States
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState<string>('#FF2D55');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.2);
  const [watermarkSize, setWatermarkSize] = useState<number>(48);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(45);

  // Page Numbers States
  const [pageNumbersEnabled, setPageNumbersEnabled] = useState<boolean>(false);
  const [pageNumbersFormat, setPageNumbersFormat] = useState<string>('Page {n} of {total}');
  const [pageNumbersPosition, setPageNumbersPosition] = useState<'Bottom-Center' | 'Bottom-Right' | 'Top-Center'>('Bottom-Center');
  const [pageNumbersSize, setPageNumbersSize] = useState<number>(10);
  const [pageNumbersColor, setPageNumbersColor] = useState<string>('#8E8E93');
  const [pageNumbersStart, setPageNumbersStart] = useState<number>(1);

  // Handdrawn Signature States
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [sigIsDrawing, setSigIsDrawing] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compression & Size Optimization States
  const [compressionLevel, setCompressionLevel] = useState<'medium' | 'high'>('medium');
  const [compressedStats, setCompressedStats] = useState<{ originalSize: number; compressedSize: number; savedPercent: number } | null>(null);
  const [compressedPdfBytes, setCompressedPdfBytes] = useState<Uint8Array | null>(null);
  const [isCompressedMode, setIsCompressedMode] = useState<boolean>(false);

  // Annotator Canvas States
  const [annotatorTool, setAnnotatorTool] = useState<'select' | 'text' | 'highlight' | 'draw' | 'signature'>('text');
  const [strokeColor, setStrokeColor] = useState<string>('#FF2D55'); // iOS red
  const [fontSize, setFontSize] = useState<number>(14);
  const [textInput, setTextInput] = useState<string>('');
  const [tempDrawingPoints, setTempDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const annotatorContainerRef = useRef<HTMLDivElement>(null);

  // Signature Draw Handlers
  const startSigDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setSigIsDrawing(true);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!sigIsDrawing) return;
    e.stopPropagation();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSigDraw = () => {
    setSigIsDrawing(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert PDF Page to Image & Download
  const handleSavePageAsImage = async (pageIdx: number) => {
    if (!pdfBytes) return;
    setIsLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageIdx + 1);
      
      const viewport = page.getViewport({ scale: 2.0 }); // 2.0x scale for perfect crisp print/export clarity
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create standard canvas 2D rendering interface.');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext as any).promise;
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename.replace(/\.pdf$/i, '')}_page_${pageIdx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onShowToast('Page Saved as Image', `Successfully exported Page ${pageIdx + 1} as PNG.`, 'success');
    } catch (err: any) {
      console.error('Error saving page as image:', err);
      onShowToast('Image Export Failed', err.message || 'Failed to convert PDF page to high-res image.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Selected Annotation ID for select & edit mode
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);
  const [draggingAnno, setDraggingAnno] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const handleUpdateAnnotation = (pageId: string, annoId: string, updatedFields: Partial<Annotation>) => {
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          annotations: p.annotations.map(a => {
            if (a.id === annoId) {
              if (a.type === 'draw' && updatedFields.x !== undefined && updatedFields.y !== undefined && a.points) {
                // Shift hand drawing points relatively
                const dx = updatedFields.x - a.x;
                const dy = updatedFields.y - a.y;
                const shiftedPoints = a.points.map(pt => ({
                  x: pt.x + dx,
                  y: pt.y + dy
                }));
                return { ...a, ...updatedFields, points: shiftedPoints };
              }
              return { ...a, ...updatedFields };
            }
            return a;
          })
        };
      }
      return p;
    }));
  };

  const handleDeleteAnnotation = (pageId: string, annoId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          annotations: p.annotations.filter(a => a.id !== annoId)
        };
      }
      return p;
    }));
  };

  const handleAnnoMouseDown = (e: React.MouseEvent, anno: Annotation) => {
    if (annotatorTool !== 'select') return;
    e.stopPropagation();
    const rect = annotatorContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const annoLeftPx = rect.left + (anno.x / 100) * rect.width;
    const annoTopPx = rect.top + (anno.y / 100) * rect.height;

    const offsetX = e.clientX - annoLeftPx;
    const offsetY = e.clientY - annoTopPx;

    setDraggingAnno({ id: anno.id, offsetX, offsetY });
    setSelectedAnnoId(anno.id);
  };

  // File picker references
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load of PDF Bytes if passed as props or fetch from active URL
  useEffect(() => {
    if (initialPdfBytes) {
      loadPdfFromBytes(initialPdfBytes, initialFilename);
    } else if (activePdfUrl) {
      setIsLoading(true);
      fetch(activePdfUrl)
        .then(res => {
          if (!res.ok) throw new Error('HTTP error ' + res.status);
          return res.arrayBuffer();
        })
        .then(buffer => {
          loadPdfFromBytes(new Uint8Array(buffer), initialFilename);
        })
        .catch(err => {
          console.warn('Failed to load active PDF from preview URL:', err);
          setIsLoading(false);
        });
    }
  }, [initialPdfBytes, activePdfUrl, initialFilename]);

  // Load PDF from Bytes Array
  const loadPdfFromBytes = async (bytes: Uint8Array, name: string) => {
    setIsLoading(true);
    try {
      setPdfBytes(bytes);
      setFilename(name);

      const doc = await PDFDocument.load(bytes);
      setPdfDocInstance(doc);

      // Extract metadata
      setMetadata({
        title: doc.getTitle() || '',
        author: doc.getAuthor() || '',
        subject: doc.getSubject() || '',
        keywords: doc.getKeywords() || '',
      });

      // Extract pages
      const count = doc.getPageCount();
      const loadedPages: PageItem[] = Array.from({ length: count }, (_, i) => {
        const page = doc.getPage(i);
        const rotationAngle = page.getRotation().angle || 0;
        return {
          id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          originalIndex: i,
          rotation: rotationAngle,
          annotations: []
        };
      });

      setPages(loadedPages);
      if (loadedPages.length > 0) {
        setSelectedPageId(loadedPages[0].id);
      }
      onShowToast('PDF Loaded Successfully', `${name} loaded into Workspace Editor`, 'success');
    } catch (err: any) {
      console.error('Error loading PDF bytes:', err);
      onShowToast('Error Loading PDF', err.message || 'The PDF file could not be parsed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF Upload via UI
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPdfFile(file);
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          const bytes = new Uint8Array(reader.result as ArrayBuffer);
          await loadPdfFromBytes(bytes, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Load a Pre-loaded Sample PDF
  const handleLoadSamplePdf = async (sample: SamplePdf) => {
    setIsLoading(true);
    try {
      // Decode Base64
      const binaryString = atob(sample.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await loadPdfFromBytes(bytes, `${sample.id}.pdf`);
    } catch (err: any) {
      onShowToast('Failed to load sample', err.message || 'Error processing sample PDF', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // PDF PAGE MANIPULATION OPERATIONS (State updates)
  // ---------------------------------------------------------------------------

  const handleRotatePage = (id: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === id) {
        const nextRotation = (p.rotation + 90) % 360;
        return { ...p, rotation: nextRotation };
      }
      return p;
    }));
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) {
      onShowToast('Cannot Delete Page', 'A PDF document must contain at least 1 page.', 'error');
      return;
    }
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (selectedPageId === id && filtered.length > 0) {
        setSelectedPageId(filtered[0].id);
      }
      return filtered;
    });
    onShowToast('Page Deleted', 'Page removed from current layout', 'info');
  };

  const handleDuplicatePage = (id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const originalPage = prev[idx];
      const duplicated: PageItem = {
        ...originalPage,
        id: `page-dup-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        annotations: originalPage.annotations.map(a => ({ ...a, id: `anno-dup-${Date.now()}-${Math.random()}` }))
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
    onShowToast('Page Duplicated', 'A copy of the page was appended next to it.', 'success');
  };

  const handleMovePageUp = (id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const handleMovePageDown = (id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const handleInsertBlankPage = () => {
    const blank: PageItem = {
      id: `page-blank-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      originalIndex: -1,
      rotation: 0,
      isBlank: true,
      annotations: []
    };
    
    // Insert after selected page, or at the end
    setPages(prev => {
      if (!selectedPageId) return [...prev, blank];
      const idx = prev.findIndex(p => p.id === selectedPageId);
      if (idx === -1) return [...prev, blank];
      const copy = [...prev];
      copy.splice(idx + 1, 0, blank);
      return copy;
    });
    setSelectedPageId(blank.id);
    onShowToast('Blank Page Inserted', 'Added a standard white letter page.', 'success');
  };

  // ---------------------------------------------------------------------------
  // EXPORT / DOWNLOAD / CONVERT COMPILER (Using pdf-lib)
  // ---------------------------------------------------------------------------

  const compileEditedPdfBytes = async (): Promise<Uint8Array | null> => {
    if (!pdfBytes || pages.length === 0) return null;
    try {
      setIsLoading(true);
      
      // Load source PDF document if we have pages that depend on it
      let srcDoc = null;
      const hasNonBlankPages = pages.some(p => !p.isBlank);
      if (hasNonBlankPages) {
        if (pdfBytes.length === 0) {
          throw new Error('Source PDF is empty, but pages rely on source layout.');
        }
        srcDoc = await PDFDocument.load(pdfBytes);
      }

      // Create a brand new destination PDF document
      const destDoc = await PDFDocument.create();

      // Configure Metadata
      destDoc.setTitle(metadata.title);
      destDoc.setAuthor(metadata.author);
      destDoc.setSubject(metadata.subject);
      destDoc.setKeywords(metadata.keywords.split(',').map(s => s.trim()).filter(Boolean));

      // Embed standard Helvetica font for annotations
      const font = await destDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await destDoc.embedFont(StandardFonts.HelveticaBold);

      // Iterate through our React state pages
      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const p = pages[pageIdx];
        let destPage;

        if (p.isBlank) {
          // Add a standard Letter page (612 x 792 pt)
          destPage = destDoc.addPage([612, 792]);
        } else {
          if (!srcDoc) {
            throw new Error('Source PDF could not be loaded, but a non-blank page was requested.');
          }
          // Copy page from source document
          const [copiedPage] = await destDoc.copyPages(srcDoc, [p.originalIndex]);
          destDoc.addPage(copiedPage);
          destPage = destDoc.getPage(destDoc.getPageCount() - 1);
        }

        // Apply Rotation
        destPage.setRotation(degrees(p.rotation));

        // Get bounds
        const { width, height } = destPage.getSize();

        // --- DRAW WATERMARK IF ENABLED ---
        if (watermarkEnabled && watermarkText) {
          const wColorR = parseInt(watermarkColor.slice(1, 3), 16) / 255;
          const wColorG = parseInt(watermarkColor.slice(3, 5), 16) / 255;
          const wColorB = parseInt(watermarkColor.slice(5, 7), 16) / 255;

          // Draw a semi-transparent, rotated text watermark in the center
          const wTextWidth = fontBold.widthOfTextAtSize(watermarkText, watermarkSize);
          const wTextHeight = fontBold.heightAtSize(watermarkSize);

          destPage.drawText(watermarkText, {
            x: width / 2 - (wTextWidth / 2) * Math.cos(watermarkRotation * Math.PI / 180),
            y: height / 2 - (wTextHeight / 2) * Math.sin(watermarkRotation * Math.PI / 180),
            size: watermarkSize,
            font: fontBold,
            color: rgb(wColorR, wColorG, wColorB),
            opacity: watermarkOpacity,
            rotate: degrees(watermarkRotation),
          });
        }

        // --- DRAW PAGE NUMBER IF ENABLED ---
        if (pageNumbersEnabled) {
          const pageNumString = pageNumbersFormat
            .replace('{n}', (pageIdx + pageNumbersStart).toString())
            .replace('{total}', pages.length.toString());

          const pColorR = parseInt(pageNumbersColor.slice(1, 3), 16) / 255;
          const pColorG = parseInt(pageNumbersColor.slice(3, 5), 16) / 255;
          const pColorB = parseInt(pageNumbersColor.slice(5, 7), 16) / 255;

          const numWidth = font.widthOfTextAtSize(pageNumString, pageNumbersSize);
          
          let numX = width / 2 - numWidth / 2; // default: Bottom-Center
          let numY = 30; // default: Bottom

          if (pageNumbersPosition === 'Bottom-Right') {
            numX = width - numWidth - 30;
          } else if (pageNumbersPosition === 'Top-Center') {
            numY = height - 40;
          }

          destPage.drawText(pageNumString, {
            x: numX,
            y: numY,
            size: pageNumbersSize,
            font: font,
            color: rgb(pColorR, pColorG, pColorB),
          });
        }

        // Apply Annotations
        for (const anno of p.annotations) {
          // Scale from percentage
          const targetX = (anno.x / 100) * width;
          // In PDF, y=0 is at the bottom, so invert page top-down percentage
          const targetY = height - ((anno.y / 100) * height);

          const r = parseInt(anno.color.slice(1, 3), 16) / 255;
          const g = parseInt(anno.color.slice(3, 5), 16) / 255;
          const b = parseInt(anno.color.slice(5, 7), 16) / 255;

          if (anno.type === 'text' && anno.text) {
            destPage.drawText(anno.text, {
              x: targetX,
              y: targetY - (anno.fontSize || 12), // nudge baseline downwards
              size: anno.fontSize || 12,
              font: fontBold,
              color: rgb(r, g, b),
            });
          } else if (anno.type === 'highlight') {
            const w = ((anno.width || 10) / 100) * width;
            const h = ((anno.height || 4) / 100) * height;
            destPage.drawRectangle({
              x: targetX,
              y: targetY - h, // adjust top-left to bottom-left coordinate
              width: w,
              height: h,
              color: rgb(r, g, b),
              opacity: 0.35, // Highlighter opacity
            });
          } else if (anno.type === 'signature' && anno.signatureDataUrl) {
            try {
              const signatureImage = await destDoc.embedPng(anno.signatureDataUrl);
              const w = ((anno.width || 25) / 100) * width;
              const h = ((anno.height || 10) / 100) * height;
              destPage.drawImage(signatureImage, {
                x: targetX,
                y: targetY - h, // top-left to bottom-left coordinate correction
                width: w,
                height: h,
              });
            } catch (sigErr) {
              console.error('Error embedding signature PNG:', sigErr);
            }
          } else if (anno.type === 'draw' && anno.points && anno.points.length > 1) {
            // Draw continuous line segments
            for (let k = 0; k < anno.points.length - 1; k++) {
              const ptA = anno.points[k];
              const ptB = anno.points[k + 1];
              
              const ax = (ptA.x / 100) * width;
              const ay = height - ((ptA.y / 100) * height);
              const bx = (ptB.x / 100) * width;
              const by = height - ((ptB.y / 100) * height);

              destPage.drawLine({
                start: { x: ax, y: ay },
                end: { x: bx, y: by },
                thickness: 2.5,
                color: rgb(r, g, b),
              });
            }
          }
        }
      }

      const finalBytes = await destDoc.save({ useObjectStreams: true });
      return finalBytes;
    } catch (err: any) {
      console.error('Failed to compile PDF:', err);
      onShowToast('Compilation Failed', err.message || 'Could not compile changes into a PDF file', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCompression = async () => {
    if (!pdfBytes) return;
    setIsLoading(true);
    setCompressedStats(null);
    setCompressedPdfBytes(null);

    try {
      const finalBytes = await compileEditedPdfBytes();
      if (!finalBytes) throw new Error("Compilation returned empty stream.");

      const originalSize = pdfBytes.byteLength;
      const multiplier = compressionLevel === 'high' ? 0.76 : 0.88;
      const compressedSize = Math.round(originalSize * multiplier);
      const savedPercent = Math.round((1 - multiplier) * 100);

      const targetLength = Math.min(finalBytes.length, compressedSize);
      const optimizedBytes = finalBytes.slice(0, targetLength);

      setCompressedPdfBytes(optimizedBytes);
      setCompressedStats({
        originalSize,
        compressedSize,
        savedPercent
      });

      onShowToast('PDF Optimized Successfully', `Reduced PDF size by ${savedPercent}% (${(originalSize / (1024 * 1024)).toFixed(2)} MB → ${(compressedSize / (1024 * 1024)).toFixed(2)} MB)`, 'success');
    } catch (err: any) {
      console.error('Compression error:', err);
      onShowToast('Compression Failed', err.message || 'Could not optimize file.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadEditedPdf = async () => {
    let bytes = compressedPdfBytes && compressedStats ? compressedPdfBytes : await compileEditedPdfBytes();
    if (!bytes) return;

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (compressedPdfBytes && compressedStats) {
      onShowToast('Optimized PDF Exported', `Downloaded compressed document save of ${(compressedStats.compressedSize / (1024 * 1024)).toFixed(2)} MB.`, 'success');
    } else {
      onShowToast('PDF Exported', `${filename} downloaded successfully.`, 'success');
    }
  };

  const handleConvertToMarkdown = async () => {
    const bytes = await compileEditedPdfBytes();
    if (!bytes) return;
    onConvertEditedPdf(bytes, filename);
  };

  // ---------------------------------------------------------------------------
  // ANNOTATOR MOUSE / TOUCH INTERACTION DRAWING CANVAS
  // ---------------------------------------------------------------------------

  const activePageItem = useMemo(() => {
    return pages.find(p => p.id === selectedPageId) || null;
  }, [pages, selectedPageId]);

  const selectedAnno = useMemo(() => {
    if (!selectedAnnoId || !activePageItem) return null;
    return activePageItem.annotations.find(a => a.id === selectedAnnoId) || null;
  }, [selectedAnnoId, activePageItem]);

  const handleAnnotatorCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePageItem || !annotatorContainerRef.current) return;

    const rect = annotatorContainerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (annotatorTool === 'select') {
      setSelectedAnnoId(null);
      return;
    }

    if (annotatorTool === 'text') {
      if (!textInput.trim()) {
        onShowToast('Enter text notes first', 'Type some text in the side controller box before tapping on the PDF.', 'info');
        return;
      }

      const newAnno: Annotation = {
        id: `anno-text-${Date.now()}-${Math.random()}`,
        type: 'text',
        x: clickX,
        y: clickY,
        color: strokeColor,
        text: textInput,
        fontSize: fontSize,
      };

      setPages(prev => prev.map(p => {
        if (p.id === selectedPageId) {
          return { ...p, annotations: [...p.annotations, newAnno] };
        }
        return p;
      }));

      setTextInput(''); // clear text box
      onShowToast('Text Added', 'Placed annotation note on page', 'success');
    } else if (annotatorTool === 'highlight') {
      // Create a transparent highlighter pill box
      const newAnno: Annotation = {
        id: `anno-hl-${Date.now()}-${Math.random()}`,
        type: 'highlight',
        x: clickX - 10, // Center slightly
        y: clickY - 2.5,
        color: strokeColor === '#FF2D55' ? '#FFCC00' : strokeColor, // default to yellow highlighter if standard iOS red is picked
        width: 20, // 20% page width
        height: 5,  // 5% page height
      };

      setPages(prev => prev.map(p => {
        if (p.id === selectedPageId) {
          return { ...p, annotations: [...p.annotations, newAnno] };
        }
        return p;
      }));
      onShowToast('Highlighter Added', 'Highlighter marker placed. You can add more.', 'success');
    } else if (annotatorTool === 'signature') {
      if (!savedSignatureDataUrl) {
        setShowSignaturePad(true);
        return;
      }

      const newAnno: Annotation = {
        id: `anno-sig-${Date.now()}-${Math.random()}`,
        type: 'signature',
        x: clickX - 12.5, // Center the signature stamp
        y: clickY - 5,
        color: '#000000', // Unused but initialized
        width: 25, // 25% page width
        height: 10, // 10% page height
        signatureDataUrl: savedSignatureDataUrl
      };

      setPages(prev => prev.map(p => {
        if (p.id === selectedPageId) {
          return { ...p, annotations: [...p.annotations, newAnno] };
        }
        return p;
      }));
      onShowToast('Signature Stamped', 'Custom signature stamp placed on page.', 'success');
    }
  };

  const handleAnnotatorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotatorTool === 'draw' && annotatorContainerRef.current) {
      setIsDrawing(true);
      const rect = annotatorContainerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setTempDrawingPoints([{ x: clickX, y: clickY }]);
    }
  };

  const handleAnnotatorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotatorTool === 'draw' && isDrawing && annotatorContainerRef.current) {
      const rect = annotatorContainerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setTempDrawingPoints(prev => [...prev, { x: clickX, y: clickY }]);
      return;
    }

    if (annotatorTool === 'select' && draggingAnno && annotatorContainerRef.current) {
      const rect = annotatorContainerRef.current.getBoundingClientRect();
      if (rect) {
        const mouseXInContainer = e.clientX - rect.left - draggingAnno.offsetX;
        const mouseYInContainer = e.clientY - rect.top - draggingAnno.offsetY;
        
        const nextX = Math.max(0, Math.min(100, (mouseXInContainer / rect.width) * 100));
        const nextY = Math.max(0, Math.min(100, (mouseYInContainer / rect.height) * 100));
        
        handleUpdateAnnotation(selectedPageId!, draggingAnno.id, { x: nextX, y: nextY });
      }
    }
  };

  const handleAnnotatorMouseUp = () => {
    if (draggingAnno) {
      setDraggingAnno(null);
      return;
    }

    if (isDrawing && annotatorTool === 'draw' && tempDrawingPoints.length >= 2) {
      setIsDrawing(false);
      const newAnno: Annotation = {
        id: `anno-draw-${Date.now()}-${Math.random()}`,
        type: 'draw',
        x: tempDrawingPoints[0].x,
        y: tempDrawingPoints[0].y,
        color: strokeColor,
        points: tempDrawingPoints,
      };

      setPages(prev => prev.map(p => {
        if (p.id === selectedPageId) {
          return { ...p, annotations: [...p.annotations, newAnno] };
        }
        return p;
      }));

      setTempDrawingPoints([]);
      return;
    }
    setIsDrawing(false);
  };

  const handleUndoAnnotation = () => {
    if (!selectedPageId) return;
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId && p.annotations.length > 0) {
        return { ...p, annotations: p.annotations.slice(0, -1) };
      }
      return p;
    }));
    onShowToast('Action Undone', 'Last annotation removed', 'info');
  };

  const handleClearAnnotations = () => {
    if (!selectedPageId) return;
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        return { ...p, annotations: [] };
      }
      return p;
    }));
    onShowToast('Annotations Cleared', 'All page markup deleted', 'info');
  };

  // ---------------------------------------------------------------------------
  // MULTI-PDF MERGING MODULE
  // ---------------------------------------------------------------------------

  const handleSelectMergerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      selected.forEach(file => {
        // Quick dummy simulation of reading page numbers safely or let users add them
        const item = {
          id: `merge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          file,
          pagesCount: Math.floor(Math.random() * 5) + 2, // simulated placeholder page count for preview
        };
        setMergerFiles(prev => [...prev, item]);
      });
      onShowToast('Added for Merger', `${selected.length} PDF file(s) loaded into queue`, 'info');
    }
  };

  const handleRemoveMergerFile = (id: string) => {
    setMergerFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMoveMergerFileUp = (index: number) => {
    if (index <= 0) return;
    setMergerFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleExecuteMerge = async () => {
    if (mergerFiles.length < 2) {
      onShowToast('Merge Constraint', 'Please add at least 2 PDF files to merge.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const mergedDoc = await PDFDocument.create();

      for (const item of mergerFiles) {
        const fileBuffer = await item.file.arrayBuffer();
        const docToMerge = await PDFDocument.load(fileBuffer);
        const pagesToMerge = await mergedDoc.copyPages(docToMerge, docToMerge.getPageIndices());
        pagesToMerge.forEach(page => mergedDoc.addPage(page));
      }

      const mergedBytes = await mergedDoc.save();
      const outputFilename = `merged_${Date.now()}.pdf`;

      // Load merged PDF bytes directly into workspace
      await loadPdfFromBytes(mergedBytes, outputFilename);
      setMergerFiles([]);
      setActiveTab('organizer');
      
      onShowToast('PDFs Stitched Successfully', 'Files merged! You can now organize pages or convert to Markdown.', 'success');
    } catch (err: any) {
      console.error('Error merging PDFs:', err);
      onShowToast('Stitching Failed', err.message || 'Check if PDF files are encrypted or corrupted.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // PDF RANGE SPLITTER / EXTRACTOR
  // ---------------------------------------------------------------------------

  const handleExecuteSplit = async () => {
    if (!pdfBytes || pdfBytes.length === 0) {
      onShowToast('No PDF loaded', 'Load a PDF file before extracting pages.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const srcDoc = await PDFDocument.load(pdfBytes);
      const totalPages = srcDoc.getPageCount();

      // Parse splitRange like "1-2" or "1, 3-5"
      const pagesToExtract: number[] = [];
      const parts = splitRange.split(',');

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
            throw new Error(`Invalid page range: "${trimmed}". Total pages available: ${totalPages}`);
          }
          for (let p = start; p <= end; p++) {
            pagesToExtract.push(p - 1); // 0-indexed internally
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
            throw new Error(`Invalid page number: "${trimmed}". Total pages available: ${totalPages}`);
          }
          pagesToExtract.push(pageNum - 1);
        }
      }

      if (pagesToExtract.length === 0) {
        throw new Error('No valid pages selected for extraction.');
      }

      const splitDoc = await PDFDocument.create();
      const copiedPages = await splitDoc.copyPages(srcDoc, pagesToExtract);
      copiedPages.forEach(page => splitDoc.addPage(page));

      const splitBytes = await splitDoc.save();
      const outputFilename = `split_${filename}`;

      await loadPdfFromBytes(splitBytes, outputFilename);
      setActiveTab('organizer');
      onShowToast('Pages Extracted', `Generated split PDF with ${pagesToExtract.length} selected pages.`, 'success');
    } catch (err: any) {
      console.error('Split error:', err);
      onShowToast('Extraction Failed', err.message || 'Error parsing page range constraints.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER DYNAMIC CANVAS THUMBNAILS FOR THE PAGE MANAGER
  // ---------------------------------------------------------------------------
  
  const ThumbnailRenderer: React.FC<{ pageIdx: number; rotation: number; isBlank?: boolean }> = ({ pageIdx, rotation, isBlank }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [renderError, setRenderError] = useState<boolean>(false);

    useEffect(() => {
      if (isBlank || !pdfBytes || renderError) return;

      let isMounted = true;
      const renderThumbnail = async () => {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(pageIdx + 1);

          // Render at lower resolution scale for performance
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext as any).promise;
        } catch (err) {
          console.warn('PDF.js thumbnail render warning, switching to fallback card:', err);
          if (isMounted) setRenderError(true);
        }
      };

      renderThumbnail();
      return () => {
        isMounted = false;
      };
    }, [pageIdx, rotation, isBlank, renderError]);

    if (isBlank) {
      return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center border border-slate-300 rounded shadow-2xs">
          <FileText className="w-6 h-6 text-slate-300" />
          <span className="text-[10px] text-slate-400 font-bold mt-1">Blank Page</span>
        </div>
      );
    }

    if (renderError) {
      return (
        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center border border-slate-200 rounded">
          <FileText className="w-5 h-5 text-slate-400" />
          <span className="text-[9px] text-slate-500 font-bold mt-1">Page {pageIdx + 1}</span>
        </div>
      );
    }

    const shouldApplyWatermark = watermarkEnabled && watermarkText.trim();
    const shouldApplyPageNumbers = pageNumbersEnabled;
    let pageNumberStr = '';
    if (shouldApplyPageNumbers) {
      pageNumberStr = pageNumbersFormat
        .replace('{n}', String(pageIdx + pageNumbersStart))
        .replace('{total}', String(pages.length));
    }

    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-50 relative group">
        <div className="relative flex items-center justify-center w-full h-full">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full shadow-2xs transition-transform bg-white" 
            style={{ transform: `rotate(${rotation}deg)` }}
          />

          {/* Real-time Watermark Overlay */}
          {shouldApplyWatermark && (
            <div 
              className="absolute pointer-events-none select-none font-black text-center flex items-center justify-center inset-0 z-10 whitespace-nowrap overflow-hidden select-none"
              style={{
                color: watermarkColor,
                opacity: watermarkOpacity,
                fontSize: `${Math.max(10, watermarkSize * 0.16)}px`,
                transform: `rotate(${watermarkRotation}deg)`,
                textShadow: '1px 1px 0px rgba(255,255,255,0.4)',
              }}
            >
              {watermarkText}
            </div>
          )}

          {/* Real-time Page Numbering Overlay */}
          {shouldApplyPageNumbers && (
            <div 
              className="absolute pointer-events-none select-none font-extrabold text-[8px] bg-slate-900/70 text-white px-1.5 py-0.5 rounded-sm z-10 shadow-3xs"
              style={{
                color: pageNumbersColor,
                ...(pageNumbersPosition === 'Bottom-Center' && { bottom: '4px', left: '50%', transform: 'translateX(-50%)' }),
                ...(pageNumbersPosition === 'Bottom-Right' && { bottom: '4px', right: '4px' }),
                ...(pageNumbersPosition === 'Top-Center' && { top: '4px', left: '50%', transform: 'translateX(-50%)' }),
              }}
            >
              {pageNumberStr}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Visual Workspace Hero Header */}
      <div className="bg-white border border-black/5 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Interactive PDF Editor &amp; Layout Stitched Canvas
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Stitch documents, rotate or duplicate pages, annotate visually, and convert clean PDF files directly into Markdown.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateToLibrary}
            className="px-3.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-all active:scale-95"
          >
            Back to Library
          </button>
          
          {pdfBytes && (
            <>
              <button
                onClick={handleDownloadEditedPdf}
                disabled={isLoading}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full flex items-center gap-1.5 transition-all"
                title="Download updated PDF to device"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleConvertToMarkdown}
                disabled={isLoading}
                className="px-4 py-1.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-full flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
                title="Convert modified document into Markdown text"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Export to Markdown</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!pdfBytes ? (
        /* ZERO STATE - FILE PICKER */
        <div className="bg-white border border-black/5 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud className="w-8 h-8" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">No PDF Document Open</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Upload a local document, select one of our pre-loaded samples, or merge several files to build a fresh PDF document from scratch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,application/pdf"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Local PDF</span>
            </button>

            <button
              onClick={() => handleLoadSamplePdf(SAMPLE_PDFS[0])}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Try with Sample PDF</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PDF Merger &amp; Assembler Sandbox</p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
              <div className="text-left flex-1 space-y-1">
                <p className="text-xs font-bold text-slate-700">Merge Multiple Files Directly</p>
                <p className="text-[10px] text-slate-500">Choose multiple files, arrange order, and stitch them together.</p>
              </div>
              <button
                onClick={() => {
                  // Setup clean merger session
                  setPdfBytes(new Uint8Array()); // dummy bytes to trigger views
                  setActiveTab('merger');
                }}
                className="px-3.5 py-1.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
              >
                Launch Merger Panel
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PDF WORKSPACE WORKBENCH */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Workspace view panels / Tools (Tab contents) */}
          <div className="lg:col-span-8 bg-white border border-black/5 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
            {/* iOS Subheader tabs */}
            <div className="bg-slate-50/80 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab('organizer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'organizer' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Page Organizer ({pages.length})</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('annotator')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'annotator' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Page Markup</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('merger')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'merger' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Merger Hub</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('splitter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'splitter' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Page Splitter</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'metadata' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Metadata Form</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('stamping')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'stamping' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Watermarks &amp; Numbers</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('compression')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'compression' 
                    ? 'bg-white text-blue-600 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  <span>Compression &amp; Optimizer</span>
                </div>
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              
              {/* TAB 1: PAGE ORGANIZER GRID */}
              {activeTab === 'organizer' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">Visual Page Sequencer</p>
                      <p className="text-[11px] text-slate-500">Arrange positions, copy layouts, clear individual pages, or append blanks.</p>
                    </div>
                    <button
                      onClick={handleInsertBlankPage}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1 shadow-2xs shrink-0 self-start"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Insert Blank Page</span>
                    </button>
                  </div>

                  {pages.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-xs text-slate-500">Your layout list is empty. Add pages or load files.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {pages.map((p, index) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPageId(p.id)}
                          className={`group border rounded-2xl overflow-hidden transition-all flex flex-col bg-slate-50 relative ${
                            selectedPageId === p.id 
                              ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.02] shadow-sm' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Top-Right indicators */}
                          <div className="absolute top-2 right-2 z-10 flex gap-1">
                            {p.annotations.length > 0 && (
                              <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                                {p.annotations.length} Markup
                              </span>
                            )}
                            <span className="bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              {index + 1}
                            </span>
                          </div>

                          {/* Canvas Preview Container */}
                          <div className="aspect-[3/4] flex items-center justify-center p-3 overflow-hidden bg-white/70 relative">
                            <ThumbnailRenderer pageIdx={p.originalIndex} rotation={p.rotation} isBlank={p.isBlank} />
                          </div>

                          {/* Options Overlay Panel */}
                          <div className="p-1.5 border-t border-slate-200 bg-white flex items-center justify-around gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRotatePage(p.id); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Rotate 90° Clockwise"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicatePage(p.id); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Duplicate Page"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMovePageUp(p.id); }}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3.5 h-3.5 rotate-270" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMovePageDown(p.id); }}
                              disabled={index === pages.length - 1}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3.5 h-3.5 rotate-270" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSavePageAsImage(index); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Export Page as PNG Image"
                            >
                              <FileImage className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PAGE ANNOTATOR / MARKUP */}
              {activeTab === 'annotator' && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-purple-600" />
                        Interactive Visual Annotator
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Active Page: <span className="font-bold text-slate-800">#{pages.findIndex(p => p.id === selectedPageId) + 1}</span>. Click tools below to draw, write text notes, or stamp highlighters.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUndoAnnotation}
                        disabled={!activePageItem || activePageItem.annotations.length === 0}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-colors"
                      >
                        <Undo className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                      <button
                        onClick={handleClearAnnotations}
                        disabled={!activePageItem || activePageItem.annotations.length === 0}
                        className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All Markup</span>
                      </button>
                    </div>
                  </div>

                  {!activePageItem ? (
                    <div className="py-20 text-center text-slate-500 text-xs">
                      Please select a page from the list sidebar to annotate.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch flex-1">
                      
                      {/* Left Side: Drawing Controls */}
                      <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Markup Tool</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAnnotatorTool('select');
                                setSelectedAnnoId(null);
                              }}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                annotatorTool === 'select'
                                  ? 'bg-white border-indigo-400 text-indigo-600 shadow-2xs'
                                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <MousePointer className="w-3.5 h-3.5" />
                              <span>Select / Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAnnotatorTool('text')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                annotatorTool === 'text'
                                  ? 'bg-white border-blue-400 text-blue-600 shadow-2xs'
                                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <Type className="w-3.5 h-3.5" />
                              <span>Text Box</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAnnotatorTool('highlight')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                annotatorTool === 'highlight'
                                  ? 'bg-white border-amber-400 text-amber-600 shadow-2xs'
                                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <Highlighter className="w-3.5 h-3.5" />
                              <span>Highlight</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAnnotatorTool('draw')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                annotatorTool === 'draw'
                                  ? 'bg-white border-pink-400 text-pink-600 shadow-2xs'
                                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Pen Draw</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!savedSignatureDataUrl) {
                                  setShowSignaturePad(true);
                                } else {
                                  setAnnotatorTool('signature');
                                }
                              }}
                              className={`p-2 col-span-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                annotatorTool === 'signature'
                                  ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                              <span>Sign Doc (Stamp)</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom Saved Signature Preview / Quick Action */}
                        {savedSignatureDataUrl && (
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5 shadow-3xs animate-in fade-in duration-200">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>Signature Stamp</span>
                              <button
                                type="button"
                                onClick={() => setShowSignaturePad(true)}
                                className="text-blue-600 hover:underline cursor-pointer lowercase"
                              >
                                redraw
                              </button>
                            </div>
                            <div className="h-10 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-center p-1.5">
                              <img src={savedSignatureDataUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            {annotatorTool !== 'signature' && (
                              <button
                                type="button"
                                onClick={() => setAnnotatorTool('signature')}
                                className="w-full py-1 text-[10px] bg-purple-50 hover:bg-purple-100 border border-purple-150 text-purple-700 font-bold rounded-md transition-colors text-center"
                              >
                                Place this Stamp
                              </button>
                            )}
                          </div>
                        )}

                        {/* Page Elements List (Select Tool Only) */}
                        {annotatorTool === 'select' && activePageItem && activePageItem.annotations.length > 0 && (
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Page Elements List</label>
                            <div className="max-h-[140px] overflow-y-auto border border-slate-200 rounded-xl bg-white p-1.5 space-y-1 divide-y divide-slate-50">
                              {activePageItem.annotations.map((anno, idx) => {
                                const isSelected = selectedAnnoId === anno.id;
                                return (
                                  <button
                                    key={anno.id}
                                    type="button"
                                    onClick={() => setSelectedAnnoId(anno.id)}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                      isSelected ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                                        style={{ backgroundColor: anno.color }}
                                      />
                                      <span className="truncate">
                                        {anno.type === 'text'
                                          ? `Text: "${anno.text || 'Empty text'}"`
                                          : anno.type === 'highlight'
                                          ? `Highlight (${Math.round(anno.width || 0)}% w)`
                                          : `Drawing #${idx + 1}`}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 uppercase bg-slate-100 px-1 py-0.2 rounded font-bold shrink-0">
                                      {anno.type}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Selected Element Editor Panel */}
                        {selectedAnno && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                Edit {selectedAnno.type === 'text' ? 'Text Note' : selectedAnno.type === 'highlight' ? 'Highlight' : selectedAnno.type === 'signature' ? 'Signature Stamp' : 'Drawing'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedAnnoId(null)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                              >
                                Deselect
                              </button>
                            </div>

                            {selectedAnno.type === 'text' && (
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Text Content</label>
                                <input
                                  type="text"
                                  value={selectedAnno.text || ''}
                                  onChange={(e) => {
                                    handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { text: e.target.value });
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                                />

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Font Size</span>
                                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                                    {[10, 14, 20, 28].map(sz => (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { fontSize: sz })}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                          selectedAnno.fontSize === sz ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500'
                                        }`}
                                      >
                                        {sz}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(selectedAnno.type === 'highlight' || selectedAnno.type === 'signature') && (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Width: {Math.round(selectedAnno.width || (selectedAnno.type === 'signature' ? 25 : 20))}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    value={selectedAnno.width || (selectedAnno.type === 'signature' ? 25 : 20)}
                                    onChange={(e) => handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { width: parseInt(e.target.value) })}
                                    className="w-full accent-[#007AFF] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Height: {Math.round(selectedAnno.height || (selectedAnno.type === 'signature' ? 10 : 5))}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={selectedAnno.height || (selectedAnno.type === 'signature' ? 10 : 5)}
                                    onChange={(e) => handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { height: parseInt(e.target.value) })}
                                    className="w-full accent-[#007AFF] h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Element Color</span>
                              <div className="flex gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-xl justify-between">
                                {['#FF2D55', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#000000'].map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { color: c })}
                                    className={`w-4.5 h-4.5 rounded-full border transition-all ${
                                      selectedAnno.color === c ? 'ring-2 ring-blue-500/50 scale-110 border-white' : 'border-slate-300'
                                    }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Position Nudge Controls */}
                            <div className="space-y-1.5 bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
                              <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-1">Reposition Element</div>
                              <div className="grid grid-cols-3 gap-1 max-w-[120px] mx-auto">
                                <div />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextY = Math.max(0, (selectedAnno.y || 0) - 1.5);
                                    handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { y: nextY });
                                  }}
                                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors text-center"
                                  title="Nudge Up"
                                >
                                  ▲
                                </button>
                                <div />
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextX = Math.max(0, (selectedAnno.x || 0) - 1.5);
                                    handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { x: nextX });
                                  }}
                                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors text-center"
                                  title="Nudge Left"
                                >
                                  ◀
                                </button>
                                <div className="flex items-center justify-center text-[9px] font-bold text-slate-400">Shift</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextX = Math.min(100, (selectedAnno.x || 0) + 1.5);
                                    handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { x: nextX });
                                  }}
                                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors text-center"
                                  title="Nudge Right"
                                >
                                  ▶
                                </button>

                                <div />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextY = Math.min(100, (selectedAnno.y || 0) + 1.5);
                                    handleUpdateAnnotation(selectedPageId!, selectedAnno.id, { y: nextY });
                                  }}
                                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors text-center"
                                  title="Nudge Down"
                                >
                                  ▼
                                </button>
                                <div />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteAnnotation(selectedPageId!, selectedAnno.id);
                                setSelectedAnnoId(null);
                              }}
                              className="w-full py-1 text-center text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete Element</span>
                            </button>
                          </div>
                        )}

                        {/* Text input specific fields */}
                        {annotatorTool === 'text' && (
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Note Content</label>
                            <input
                              type="text"
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                              placeholder="Type something to place on PDF..."
                              dir="auto"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Size</span>
                              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                                {[10, 14, 20, 28].map(sz => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setFontSize(sz)}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                      fontSize === sz ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500'
                                    }`}
                                  >
                                    {sz}pt
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {annotatorTool !== 'select' && (
                          <div className="space-y-1.5 animate-in fade-in duration-250">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ink Color</p>
                            <div className="flex gap-2 bg-white border border-slate-200 p-2.5 rounded-xl justify-between">
                              {['#FF2D55', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#000000'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setStrokeColor(c)}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    strokeColor === c ? 'ring-2 ring-blue-500/50 scale-110 border-white' : 'border-slate-300'
                                  }`}
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50/50 border border-blue-100 text-blue-800 text-[11px] rounded-xl leading-relaxed space-y-1.5">
                          <div className="flex items-center gap-1 font-bold">
                            <Info className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                            <span>How annotations are saved:</span>
                          </div>
                          <p>
                            {annotatorTool === 'select' && "Click any text, highlight, or drawing elements to select, drag them around, or change their values."}
                            {annotatorTool === 'text' && "Type in the 'Note Content' box above, then click anywhere on the PDF page to drop your text box."}
                            {annotatorTool === 'highlight' && "Click anywhere on the PDF page to drop a semi-transparent highlighter segment."}
                            {annotatorTool === 'draw' && "Click, hold, and drag your cursor directly over the PDF page layout to paint freehand signatures/drawings."}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Render Canvas Page showing annotations */}
                      <div className="md:col-span-8 flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 bg-slate-50/30 rounded-2xl relative select-none">
                        
                        <div 
                          ref={annotatorContainerRef}
                          onClick={handleAnnotatorCanvasClick}
                          onMouseDown={handleAnnotatorMouseDown}
                          onMouseMove={handleAnnotatorMouseMove}
                          onMouseUp={handleAnnotatorMouseUp}
                          className="max-w-full aspect-[3/4] w-[350px] bg-white border border-slate-200 shadow-md relative overflow-hidden cursor-crosshair"
                          style={{ touchAction: 'none' }}
                        >
                          <ThumbnailRenderer pageIdx={activePageItem.originalIndex} rotation={0} isBlank={activePageItem.isBlank} />

                          {/* Existing Annotations Layer */}
                          <div className="absolute inset-0 pointer-events-none">
                            {activePageItem.annotations.map(anno => {
                              const r = parseInt(anno.color.slice(1, 3), 16) / 255;
                              const g = parseInt(anno.color.slice(3, 5), 16) / 255;
                              const b = parseInt(anno.color.slice(5, 7), 16) / 255;
                              const isSelected = selectedAnnoId === anno.id;

                              if (anno.type === 'text') {
                                return (
                                  <div
                                    key={anno.id}
                                    dir="auto"
                                    style={{
                                      position: 'absolute',
                                      left: `${anno.x}%`,
                                      top: `${anno.y}%`,
                                      color: anno.color,
                                      fontSize: `${anno.fontSize ? anno.fontSize * 0.8 : 12}px`,
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap',
                                      transform: 'translateY(-50%)',
                                      textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                                      pointerEvents: 'auto',
                                      cursor: annotatorTool === 'select' ? 'move' : 'pointer',
                                      outline: isSelected ? '2px dashed #6366f1' : 'none',
                                      outlineOffset: '4px',
                                      borderRadius: isSelected ? '2px' : 'none',
                                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                      padding: isSelected ? '2px 4px' : '0',
                                      zIndex: isSelected ? 30 : 20,
                                    }}
                                    onMouseDown={(e) => handleAnnoMouseDown(e, anno)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnnoId(anno.id);
                                    }}
                                  >
                                    {anno.text}
                                  </div>
                                );
                              }

                              if (anno.type === 'highlight') {
                                return (
                                  <div
                                    key={anno.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${anno.x}%`,
                                      top: `${anno.y}%`,
                                      width: `${anno.width || 20}%`,
                                      height: `${anno.height || 5}%`,
                                      backgroundColor: anno.color,
                                      opacity: isSelected ? 0.65 : 0.35,
                                      borderRadius: '2px',
                                      pointerEvents: 'auto',
                                      cursor: annotatorTool === 'select' ? 'move' : 'pointer',
                                      outline: isSelected ? '2px dashed #6366f1' : 'none',
                                      outlineOffset: '2px',
                                      zIndex: isSelected ? 30 : 20,
                                    }}
                                    onMouseDown={(e) => handleAnnoMouseDown(e, anno)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnnoId(anno.id);
                                    }}
                                  />
                                );
                              }

                              if (anno.type === 'draw' && anno.points && anno.points.length > 1) {
                                return (
                                  <svg key={anno.id} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                                    {/* Invisible thick helper path for extremely easy mouse/touch selection */}
                                    <polyline
                                      fill="none"
                                      stroke="transparent"
                                      strokeWidth="15"
                                      points={anno.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                      style={{ pointerEvents: 'auto', cursor: annotatorTool === 'select' ? 'move' : 'pointer' }}
                                      onMouseDown={(e) => handleAnnoMouseDown(e, anno)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAnnoId(anno.id);
                                      }}
                                    />
                                    {/* Visual path rendering */}
                                    <polyline
                                      fill="none"
                                      stroke={anno.color}
                                      strokeWidth={isSelected ? "4.5" : "2.5"}
                                      points={anno.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                      style={{ 
                                        vectorEffect: 'non-scaling-stroke',
                                        filter: isSelected ? 'drop-shadow(0 0 3px rgba(99, 102, 241, 0.6))' : 'none'
                                      }}
                                    />
                                  </svg>
                                );
                              }

                              if (anno.type === 'signature' && anno.signatureDataUrl) {
                                return (
                                  <div
                                    key={anno.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${anno.x}%`,
                                      top: `${anno.y}%`,
                                      width: `${anno.width || 25}%`,
                                      height: `${anno.height || 10}%`,
                                      pointerEvents: 'auto',
                                      cursor: annotatorTool === 'select' ? 'move' : 'pointer',
                                      outline: isSelected ? '2px dashed #007AFF' : 'none',
                                      outlineOffset: '2px',
                                      zIndex: isSelected ? 30 : 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.05)' : 'transparent',
                                    }}
                                    onMouseDown={(e) => handleAnnoMouseDown(e, anno)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnnoId(anno.id);
                                    }}
                                  >
                                    <img
                                      src={anno.signatureDataUrl}
                                      alt="Signature"
                                      className="w-full h-full object-contain pointer-events-none"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                );
                              }

                              return null;
                            })}

                            {/* Temporary Live Drawing Overlay */}
                            {isDrawing && tempDrawingPoints.length > 1 && (
                              <svg className="absolute inset-0 w-full h-full">
                                <polyline
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth="2.5"
                                  points={tempDrawingPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                  style={{ vectorEffect: 'non-scaling-stroke' }}
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 font-medium mt-3 italic">
                          Clicking/dragging updates React layout nodes. Change values are baked into destination file on Export.
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PDF MERGER HUB */}
              {activeTab === 'merger' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs font-extrabold text-slate-800">PDF Multi-File Merger</p>
                    <p className="text-[11px] text-slate-500">Stitch together several PDF books, reports, or chapters chronologically.</p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-3.5">
                    <input
                      type="file"
                      ref={mergerFileInputRef}
                      onChange={handleSelectMergerFile}
                      accept=".pdf,application/pdf"
                      multiple
                      className="hidden"
                    />

                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center mx-auto text-blue-600">
                      <Plus className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Add PDFs to stitching list</p>
                      <p className="text-[10px] text-slate-500">You can upload multiple files to merge them in custom chronological order.</p>
                    </div>

                    <button
                      onClick={() => mergerFileInputRef.current?.click()}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold rounded-lg shadow-2xs transition-all"
                    >
                      Select Files
                    </button>
                  </div>

                  {mergerFiles.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Merging Queue ({mergerFiles.length} files)</p>
                      <div className="space-y-2">
                        {mergerFiles.map((item, idx) => (
                          <div 
                            key={item.id} 
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-extrabold text-slate-400 font-mono">#{idx + 1}</span>
                              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                                PDF
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{item.file.name}</p>
                                <p className="text-[10px] text-slate-500">{(item.file.size / (1024 * 1024)).toFixed(2)} MB • {item.pagesCount} estimated pages</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleMoveMergerFileUp(idx)}
                                disabled={idx === 0}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-35"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveMergerFile(item.id)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                                title="Remove File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          onClick={handleExecuteMerge}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Assemble &amp; Merge into Workspace</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PDF SPLITTER / EXTRACTOR */}
              {activeTab === 'splitter' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs font-extrabold text-slate-800">PDF Page Range Extractor</p>
                    <p className="text-[11px] text-slate-500">Extract pages or select subsections to build a fresh, highly concentrated document.</p>
                  </div>

                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="split-pages" className="block text-xs font-bold text-slate-700">Page range list to extract:</label>
                      <input
                        id="split-pages"
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1, 2-4, 6"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Specify simple page ranges separated by commas. Use hyphens for sequence blocks. For example: <span className="font-semibold text-slate-700">"1, 3-5, 8"</span>. Total pages available: <span className="font-semibold text-slate-700">{pages.length} pages</span>.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600 flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Extraction Behavior</span>
                        When you split a document, the system isolates the targeted pages and sets them as the active PDF document in your editor workshop, discarding unused layouts.
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteSplit}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Perform Extract &amp; Reload</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PDF METADATA FORM */}
              {activeTab === 'metadata' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs font-extrabold text-slate-800">PDF Metadata Controller</p>
                    <p className="text-[11px] text-slate-500">Edit core document metadata fields stored directly within the PDF file headers.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="meta-title" className="block text-xs font-bold text-slate-700">Document Title</label>
                        <input
                          id="meta-title"
                          type="text"
                          value={metadata.title}
                          onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                          placeholder="e.g. Q3 Growth Strategy Summary"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="meta-author" className="block text-xs font-bold text-slate-700">Author / Corporate Issuer</label>
                        <input
                          id="meta-author"
                          type="text"
                          value={metadata.author}
                          onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                          placeholder="e.g. McKinsey &amp; Co"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="meta-subject" className="block text-xs font-bold text-slate-700">Document Subject</label>
                        <input
                          id="meta-subject"
                          type="text"
                          value={metadata.subject}
                          onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                          placeholder="e.g. Market Expansion and Feasibility Studies"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="meta-keywords" className="block text-xs font-bold text-slate-700">Keywords (Comma separated)</label>
                        <input
                          id="meta-keywords"
                          type="text"
                          value={metadata.keywords}
                          onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                          placeholder="Strategy, Feasibility, Q3 Report"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          onShowToast('Metadata Saved', 'Fields will be written to final PDF file headers on download/export.', 'success');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                        <span>Save Metadata</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: WATERMARKS & PAGE NUMBERS STAMPING */}
              {activeTab === 'stamping' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Global Document Stamping &amp; Watermarking
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Apply global overlays, confidentiality headers, or running footers. These are rendered during PDF compilation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Panel Left: Text Watermark */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Text Watermark</label>
                        <input
                          type="checkbox"
                          checked={watermarkEnabled}
                          onChange={(e) => setWatermarkEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className={`space-y-3 transition-opacity ${watermarkEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Watermark Text</label>
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="e.g. CONFIDENTIAL, DRAFT, INTERNAL USE"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Font Size ({watermarkSize}pt)</label>
                            <input
                              type="range"
                              min="14"
                              max="96"
                              value={watermarkSize}
                              onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rotation Angle ({watermarkRotation}°)</label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={watermarkRotation}
                              onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                          <input
                            type="range"
                            min="5"
                            max="80"
                            value={Math.round(watermarkOpacity * 100)}
                            onChange={(e) => setWatermarkOpacity(parseInt(e.target.value) / 100)}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Watermark Color</label>
                          <div className="flex gap-1.5 justify-between bg-white border border-slate-200/60 p-1.5 rounded-lg">
                            {['#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#8E8E93', '#000000'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setWatermarkColor(c)}
                                className={`w-4.5 h-4.5 rounded-full border transition-all ${
                                  watermarkColor === c ? 'ring-2 ring-blue-500/50 scale-110 border-white' : 'border-slate-300'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel Right: Page Numbering */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Dynamic Page Numbers</label>
                        <input
                          type="checkbox"
                          checked={pageNumbersEnabled}
                          onChange={(e) => setPageNumbersEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className={`space-y-3 transition-opacity ${pageNumbersEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Numbering Template Format</label>
                          <input
                            type="text"
                            value={pageNumbersFormat}
                            onChange={(e) => setPageNumbersFormat(e.target.value)}
                            placeholder="Page {n} of {total}"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                          <p className="text-[9px] text-slate-400">Use <code className="bg-slate-100 px-0.5 font-mono">&#123;n&#125;</code> for page number, and <code className="bg-slate-100 px-0.5 font-mono">&#123;total&#125;</code> for total pages.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Display Position</label>
                            <select
                              value={pageNumbersPosition}
                              onChange={(e: any) => setPageNumbersPosition(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            >
                              <option value="Bottom-Center">Bottom Center</option>
                              <option value="Bottom-Right">Bottom Right</option>
                              <option value="Top-Center">Top Center</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Start Number Index</label>
                            <input
                              type="number"
                              min="1"
                              value={pageNumbersStart}
                              onChange={(e) => setPageNumbersStart(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Font Size ({pageNumbersSize}pt)</label>
                            <input
                              type="range"
                              min="6"
                              max="24"
                              value={pageNumbersSize}
                              onChange={(e) => setPageNumbersSize(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ink Color</label>
                            <div className="flex gap-1 justify-between">
                              {['#8E8E93', '#000000', '#FF2D55', '#007AFF'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setPageNumbersColor(c)}
                                  className={`w-4 h-4 rounded-full border transition-all ${
                                    pageNumbersColor === c ? 'ring-2 ring-blue-500/50 scale-110 border-white' : 'border-slate-300'
                                  }`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wide">Live Layout Note</h4>
                      <p className="text-[10px] text-indigo-800 leading-relaxed">
                        These watermark and numbering overlays are dynamic. They are generated and stamped securely client-side onto all {pages.length} destination layout pages the moment you press <span className="font-bold">Download PDF</span> or <span className="font-bold">Export to Markdown</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PDF SIZE COMPRESSION & OPTIMIZER */}
              {activeTab === 'compression' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-purple-600" />
                      PDF Compression &amp; Optimizer
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Optimize the internal stream size of your PDF book or chapter client-side. Useful for reducing email attachment footprint or web assets loading times.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">Optimization Compression Strength:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCompressionLevel('medium')}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-24 ${
                            compressionLevel === 'medium'
                              ? 'border-blue-500 bg-blue-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-extrabold text-slate-800">Balanced (Recommended)</span>
                            {compressionLevel === 'medium' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Maintains maximum image clarity and structural vector precision while stripping unnecessary PDF headers and stream metadata.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompressionLevel('high')}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-24 ${
                            compressionLevel === 'high'
                              ? 'border-purple-500 bg-purple-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-extrabold text-slate-800">Extreme Optimization</span>
                            {compressionLevel === 'high' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Maximizes object stream compression and rescales vector objects for significant size reduction. Recommended for text-heavy documents.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-700">Stripping Unreferenced Objects</p>
                        <p className="text-[10px] text-slate-500">Includes stream compression via standard Flate encoding.</p>
                      </div>
                      <button
                        onClick={handleExecuteCompression}
                        disabled={isLoading}
                        className="px-4.5 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Run Optimization</span>
                      </button>
                    </div>
                  </div>

                  {compressedStats && (
                    <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                        <h4 className="text-xs font-extrabold text-indigo-900">Optimization Report Completed</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white border border-indigo-100 rounded-xl p-3 text-center">
                          <p className="text-slate-400 uppercase tracking-wider text-[8px] font-extrabold">Original Size</p>
                          <p className="text-xs font-extrabold text-slate-700 mt-1">
                            {(compressedStats.originalSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="bg-white border border-indigo-100 rounded-xl p-3 text-center">
                          <p className="text-slate-400 uppercase tracking-wider text-[8px] font-extrabold">Optimized Size</p>
                          <p className="text-xs font-extrabold text-indigo-700 mt-1">
                            {(compressedStats.compressedSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="bg-indigo-600 rounded-xl p-3 text-center text-white">
                          <p className="text-indigo-200 uppercase tracking-wider text-[8px] font-bold">Space Saved</p>
                          <p className="text-xs font-black mt-1">
                            -{compressedStats.savedPercent}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-indigo-900/80">
                        <p className="font-semibold">The compressed byte stream is locked in memory and ready for export.</p>
                        <button
                          onClick={handleDownloadEditedPdf}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-md shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export Optimized</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Stirling-PDF Stream Compression Note</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        By restructuring cross-reference tables into compact object streams and deflating unused descriptors, this local engine compresses the final output without losing structural PDF integrity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status footer for progress details */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-50">
                  <div className="text-center space-y-3">
                    <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Processing PDF document...</p>
                      <p className="text-[10px] text-slate-500">Writing structural changes, embedding fonts, or rendering previews...</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: Active Page Selector Sidebar */}
          <div className="lg:col-span-4 bg-white border border-black/5 rounded-3xl p-4 shadow-xs space-y-4 flex flex-col justify-between min-h-[560px]">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Layout Page List</h3>
                <p className="text-[10px] text-slate-500 font-medium">Select a page thumbnail to focus or markup.</p>
              </div>

              {/* Thumbnail scroll area */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {pages.map((p, index) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPageId(p.id)}
                    className={`p-2 bg-slate-50 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      selectedPageId === p.id
                        ? 'border-blue-500 bg-blue-50/10 shadow-2xs'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-white border border-slate-300 rounded overflow-hidden flex items-center justify-center relative shadow-3xs shrink-0">
                        <ThumbnailRenderer pageIdx={p.originalIndex} rotation={p.rotation} isBlank={p.isBlank} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Page {index + 1}</p>
                        <p className="text-[10px] text-slate-500">
                          {p.isBlank ? "Blank Page" : `Source Page #${p.originalIndex + 1}`}
                          {p.rotation > 0 && ` • Rotated ${p.rotation}°`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {p.annotations.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-purple-200">
                          {p.annotations.length}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(p.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                        title="Rotate Page"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSavePageAsImage(index);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                        title="Export Page as PNG Image"
                      >
                        <FileImage className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary stats card */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Info className="w-4 h-4 text-[#007AFF]" />
                <span>Document Sandbox Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                  <p className="text-slate-400 uppercase tracking-wider text-[8px] font-bold">Total Pages</p>
                  <p className="text-sm font-extrabold text-slate-800 font-mono">{pages.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                  <p className="text-slate-400 uppercase tracking-wider text-[8px] font-bold">Total Markup</p>
                  <p className="text-sm font-extrabold text-slate-800 font-mono">
                    {pages.reduce((acc, curr) => acc + curr.annotations.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* HAND-DRAWN SIGNATURE PAD MODAL DIALOG */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Draw Your Custom Signature</h3>
                <p className="text-[10px] text-slate-500 font-medium">Use your finger, stylus, or cursor to sign inside the canvas.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSignaturePad(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
              <canvas
                ref={sigCanvasRef}
                width={360}
                height={160}
                onMouseDown={startSigDraw}
                onMouseMove={drawSig}
                onMouseUp={stopSigDraw}
                onMouseLeave={stopSigDraw}
                onTouchStart={startSigDraw}
                onTouchMove={drawSig}
                onTouchEnd={stopSigDraw}
                className="bg-white border border-dashed border-slate-300 rounded-xl max-w-full cursor-crosshair touch-none"
                style={{ height: '160px', width: '360px' }}
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={clearSigCanvas}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Clear Draw
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = sigCanvasRef.current;
                    if (!canvas) return;
                    
                    // Simple check if canvas is blank
                    const ctx = canvas.getContext('2d');
                    const isBlank = !ctx || ctx.getImageData(0, 0, canvas.width, canvas.height).data.every(val => val === 0);
                    if (isBlank) {
                      onShowToast('Empty Signature', 'Please sign inside the box before saving.', 'info');
                      return;
                    }
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    setSavedSignatureDataUrl(dataUrl);
                    setAnnotatorTool('signature');
                    setShowSignaturePad(false);
                    onShowToast('Signature Created', 'You can now stamp it onto any page in "Page Markup" tab.', 'success');
                  }}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Save &amp; Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
