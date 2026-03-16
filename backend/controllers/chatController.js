const { generateEmbedding } = require('../services/embeddingService');
const { vectorSearch } = require('../services/vectorSearchService');
const { streamChat } = require('../services/llmService');

exports.askQuestion = async (req, res) => {
  try {
    const { question, documentId } = req.body;
    console.log('📝 ===== CHAT REQUEST =====');
    console.log('📝 Question:', question);
    console.log('📝 Document ID:', documentId);
    
    if (!question) {
      console.log('❌ No question provided');
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('🔍 Generating embedding...');
    const questionEmbedding = await generateEmbedding(question);
    console.log('✅ Embedding generated, length:', questionEmbedding?.length);

    console.log('🔍 Searching vector database...');
    const relevantChunks = await vectorSearch(questionEmbedding, 5, documentId);
    console.log(`📊 Found ${relevantChunks?.length || 0} chunks`);

    if (!relevantChunks || !relevantChunks.length) {
      console.log('❌ No relevant chunks found');
      return res.status(404).json({ error: 'No relevant information found' });
    }

    console.log('📄 First chunk sample:', relevantChunks[0]?.content?.substring(0, 100));
    
    const context = relevantChunks.map(
      (c) =>
        `[Source: ${c.document?.fileName || 'Unknown'} (Page ${c.metadata?.page || 1})]\n${c.content}`
    ).join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant for company SOPs. Answer based on the provided context. Always cite the source at the end.',
      },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
    ];

    console.log('💬 Streaming response from LLM...');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let tokenCount = 0;
    for await (const token of streamChat(messages)) {
      if (token) {
        tokenCount++;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    console.log(`✅ Sent ${tokenCount} tokens`);
    res.write('data: [DONE]\n\n');
    res.end();
    console.log('✅ Response complete');
    
  } catch (error) {
    console.error('❌ Ask question error:', error);
    console.error('❌ Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process question: ' + error.message });
    } else {
      res.write('data: {"error": "Stream failed"}\n\n');
      res.end();
    }
  }
};