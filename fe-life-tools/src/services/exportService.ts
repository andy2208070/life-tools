import { zipSync, strToU8 } from 'fflate';
import type { DocumentPage, OutputFormat } from '../types/ocr';

/**
 * Initiates a browser file download using a temporary anchor element
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates an output filename based on the original file name and format
 */
export function getOutputFilename(originalName: string, format: OutputFormat): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}-ocr.${format}`;
}

/**
 * Escapes XML special characters for OpenXML docx
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Exports recognized text to Plain Text (.txt)
 */
export function exportToText(pages: DocumentPage[], originalName: string): void {
  const totalPages = pages.length;
  let textContent = '';

  if (totalPages === 1) {
    textContent = pages[0]?.ocrResult?.text || '';
  } else {
    textContent = pages
      .map(
        (page) =>
          `=== Page ${page.pageNumber} ===\n\n${page.ocrResult?.text || '(No text recognized on this page)'}`
      )
      .join('\n\n\n');
  }

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, getOutputFilename(originalName, 'txt'));
}

/**
 * Exports recognized text to Markdown (.md)
 */
export function exportToMarkdown(pages: DocumentPage[], originalName: string): void {
  const totalPages = pages.length;
  let mdContent = `# OCR Text Extraction: ${originalName}\n\n`;

  if (totalPages === 1) {
    mdContent += pages[0]?.ocrResult?.text || '';
  } else {
    mdContent += pages
      .map(
        (page) =>
          `## Page ${page.pageNumber}\n\n${page.ocrResult?.text || '*(No text recognized)*'}`
      )
      .join('\n\n---\n\n');
  }

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, getOutputFilename(originalName, 'md'));
}

/**
 * Exports document and recognized text to a styled, responsive HTML document
 */
export function exportToHtml(pages: DocumentPage[], originalName: string): void {
  const pageSections = pages
    .map((page) => {
      const pageText = page.ocrResult?.text || '';
      const paragraphs = pageText
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `<p>${escapeXml(line)}</p>`)
        .join('\n');

      return `
        <section class="page-card">
          <div class="page-header">
            <h2>Page ${page.pageNumber}</h2>
            ${page.ocrResult?.confidence ? `<span class="badge">Confidence: ${page.ocrResult.confidence}%</span>` : ''}
          </div>
          <div class="page-body">
            <div class="image-column">
              <img src="${page.imageUrl}" alt="Page ${page.pageNumber} Preview" />
            </div>
            <div class="text-column">
              ${paragraphs || '<p class="empty">No text recognized on this page.</p>'}
            </div>
          </div>
        </section>
      `;
    })
    .join('\n');

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OCR Extraction - ${escapeXml(originalName)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --accent: #6366f1;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    h1 {
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
      color: #fff;
    }
    .page-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.2);
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .badge {
      background: var(--accent);
      color: white;
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }
    .page-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }
    @media (max-width: 768px) {
      .page-body {
        grid-template-columns: 1fr;
      }
    }
    .image-column img {
      width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid var(--border);
      display: block;
    }
    .text-column {
      white-space: pre-wrap;
      font-size: 0.95rem;
      background: rgba(0, 0, 0, 0.15);
      padding: 1rem;
      border-radius: 6px;
      overflow-y: auto;
      max-height: 600px;
    }
    .empty {
      color: var(--text-muted);
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Document OCR Result</h1>
      <p style="color: var(--text-muted); margin: 0;">Source: ${escapeXml(originalName)} &bull; Extracted locally with Life-Tools OCR</p>
    </header>
    ${pageSections}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, getOutputFilename(originalName, 'html'));
}

/**
 * Exports document to Microsoft Word (.docx) format using OpenXML zip structure
 */
export function exportToDocx(pages: DocumentPage[], originalName: string): void {
  // Build document.xml paragraphs
  let docXmlParagraphs = '';

  pages.forEach((page, idx) => {
    // Page heading
    docXmlParagraphs += `
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="32"/>
            <w:color w:val="333333"/>
          </w:rPr>
          <w:t>Page ${page.pageNumber}</w:t>
        </w:r>
      </w:p>
    `;

    const text = page.ocrResult?.text || '';
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        docXmlParagraphs += `
          <w:p>
            <w:r>
              <w:rPr>
                <w:sz w:val="24"/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(line)}</w:t>
            </w:r>
          </w:p>
        `;
      }
    }

    // Insert page break if not the last page
    if (idx < pages.length - 1) {
      docXmlParagraphs += `
        <w:p>
          <w:r>
            <w:br w:type="page"/>
          </w:r>
        </w:p>
      `;
    }
  });

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docXmlParagraphs}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const docxZip = zipSync({
    '[Content_Types].xml': strToU8(contentTypesXml),
    '_rels/.rels': strToU8(relsXml),
    'word/document.xml': strToU8(documentXml),
  });

  const blob = new Blob([docxZip.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  downloadBlob(blob, getOutputFilename(originalName, 'docx'));
}

/**
 * Exports document to a PDF file.
 * Uses Tesseract's native searchable PDF bytes if single page, or builds a multi-page PDF.
 */
export function exportToPdf(pages: DocumentPage[], originalName: string): void {
  // If we have single page with native Tesseract PDF bytes, download directly
  if (pages.length === 1 && pages[0]?.ocrResult?.pdfBytes) {
    const uint8 = new Uint8Array(pages[0].ocrResult.pdfBytes);
    const blob = new Blob([uint8.buffer], { type: 'application/pdf' });
    downloadBlob(blob, getOutputFilename(originalName, 'pdf'));
    return;
  }

  // Multi-page standard PDF generator
  // Generates a valid standard PDF 1.4 document containing pages with recognized text
  let pdfOutput = '%PDF-1.4\n';
  const objects: string[] = [];
  const offsets: number[] = [];

  const addObject = (content: string) => {
    offsets.push(pdfOutput.length);
    const id = objects.length + 1;
    const objStr = `${id} 0 obj\n${content}\nendobj\n`;
    objects.push(objStr);
    pdfOutput += objStr;
    return id;
  };

  // Font object (Helvetica)
  const fontObjId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  // Page object IDs
  const pageIds: number[] = [];

  for (const page of pages) {
    const text = page.ocrResult?.text || '';
    // Format lines for PDF text object
    const lines = text.split('\n').filter((l) => l.trim()).slice(0, 45); // Fit within page height

    let streamData = 'BT\n/F1 12 Tf\n50 780 Td\n16 TL\n';
    for (const line of lines) {
      // Escape parentheses in PDF string
      const sanitized = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      streamData += `(${sanitized}) '\n`;
    }
    streamData += 'ET\n';

    const contentStreamId = addObject(
      `<< /Length ${streamData.length} >>\nstream\n${streamData}endstream`
    );

    const pageObjId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentStreamId} 0 R >>`
    );
    pageIds.push(pageObjId);
  }

  // Pages root object (id 2)
  const pagesRootId = addObject(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  );

  // Catalog object
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesRootId} 0 R >>`);

  // Xref table
  const startXref = pdfOutput.length;
  pdfOutput += 'xref\n';
  pdfOutput += `0 ${objects.length + 1}\n`;
  pdfOutput += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdfOutput += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  // Trailer
  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const blob = new Blob([pdfOutput], { type: 'application/pdf' });
  downloadBlob(blob, getOutputFilename(originalName, 'pdf'));
}

/**
 * Unified export dispatcher supporting all output formats
 */
export function exportDocument(
  format: OutputFormat,
  pages: DocumentPage[],
  originalName: string
): void {
  if (pages.length === 0) {
    throw new Error('No document pages available to export.');
  }

  switch (format) {
    case 'txt':
      exportToText(pages, originalName);
      break;
    case 'md':
      exportToMarkdown(pages, originalName);
      break;
    case 'html':
      exportToHtml(pages, originalName);
      break;
    case 'docx':
      exportToDocx(pages, originalName);
      break;
    case 'pdf':
      exportToPdf(pages, originalName);
      break;
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}
