const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extract text and metadata from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<{text: string, pages: number, info: object}>}
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Log extracted text length for debugging
    console.log(`📄 Extracted text length: ${data.text.length} characters`);
    if (data.text.length === 0) {
      console.warn('⚠️ No text extracted – PDF may be scanned or empty');
    }

    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('❌ PDF parsing error:', error);
    throw new Error('Failed to parse PDF');
  }
}

module.exports = parsePDF;