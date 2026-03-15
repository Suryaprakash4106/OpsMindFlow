const axios = require('axios');

async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        model: "models/gemini-embedding-001",
        content: {
          parts: [{ text: text }]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(' Embedding length:', response.data.embedding.values.length);
    return response.data.embedding.values; // 768 dimensions
  } catch (error) {
    console.error('Google Embedding error:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
}

module.exports = { generateEmbedding };