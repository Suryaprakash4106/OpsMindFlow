const { generateEmbedding } = require('../services/embeddingService');
const { vectorSearch } = require('../services/vectorSearchService');
const { streamChat } = require('../services/llmService');

exports.askQuestion = async (req, res) => {
  try {
    const { question, documentId } = req.body; // <-- added documentId
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const questionEmbedding = await generateEmbedding(question);

    // Pass documentId to vectorSearch (if provided)
    const relevantChunks = await vectorSearch(questionEmbedding, 5, documentId);

    if (!relevantChunks.length) {
      return res.status(404).json({ error: 'No relevant information found' });
    }

    const context = relevantChunks.map(
      (c) =>
        `[Source: ${c.document.fileName} (Page ${c.metadata.page})]\n${c.content}`
    ).join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant for company SOPs. Answer based on the provided context. Always cite the source at the end.',
      },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const token of streamChat(messages)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Ask question error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process question' });
    } else {
      res.write('data: {"error": "Stream failed"}\n\n');
      res.end();
    }
  }
};