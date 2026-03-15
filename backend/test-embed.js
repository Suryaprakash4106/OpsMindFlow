require('dotenv').config();
const { generateEmbedding } = require('./services/embeddingService');

(async () => {
  try {
    const emb = await generateEmbedding('This is a test sentence.');
    console.log('✅ Embedding length:', emb.length);
  } catch (err) {
    console.error('Error:', err);
  }
})();