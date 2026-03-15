/**
 * Split text into overlapping chunks for embedding
 * @param {string} text - The full text to chunk
 * @param {number} chunkSize - Maximum characters per chunk (default: 1000)
 * @param {number} overlap - Overlap between chunks (default: 100)
 * @returns {string[]} Array of text chunks
 */
function chunkText(text, chunkSize = 1000, overlap = 100) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

module.exports = chunkText;