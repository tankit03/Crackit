import JSZip from 'jszip';
import { DOMParser } from 'xmldom';
import mammoth from 'mammoth';

function getTextFromNodes(node: any, tagName: string, namespaceURI: string) {
  let text = '';
  const textNodes = node.getElementsByTagNameNS(namespaceURI, tagName);
  for (let i = 0; i < textNodes.length; i++) {
    text += textNodes[i].textContent + ' ';
  }
  return text.trim();
}

export async function getTextFromPPTX(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    const aNamespace = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    let text = '';

    let slideIndex = 1;
    while (true) {
      const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);

      if (!slideFile) break;

      const slideXmlStr = await slideFile.async('text');

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXmlStr, 'application/xml');

      text += getTextFromNodes(xmlDoc, 't', aNamespace) + ' ';

      slideIndex++;
    }

    return text.trim();
  } catch (error) {
    console.error('Error extracting text from PPTX:', error);
    throw new Error('Failed to extract text from PPTX file');
  }
}

export async function getTextFromPDF(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('File', file);

    const apiKey = process.env.NEXT_PUBLIC_CONVERT_API_KEY;
    if (!apiKey) {
      throw new Error('ConvertAPI key is not configured');
    }

    const response = await fetch(
      `https://v2.convertapi.com/convert/pdf/to/txt?auth=${apiKey}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to convert PDF to text');
    }

    const data = await response.json();

    if (!data.Files || !data.Files[0] || !data.Files[0].FileData) {
      throw new Error('Invalid response format from ConvertAPI');
    }

    // Decode the base64 text
    const decodedText = atob(data.Files[0].FileData);
    return decodedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

export async function getTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

export async function convertFileToText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return getTextFromPDF(file);
  } else if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.name.endsWith('.pptx')
  ) {
    const arrayBuffer = await file.arrayBuffer();
    return getTextFromPPTX(arrayBuffer);
  } else if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return getTextFromDOCX(file);
  } else {
    throw new Error(
      'Unsupported file type. Please upload a PDF, PPTX, or DOCX file.'
    );
  }
}
