const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Stream chat completions using Groq's free API
 */
async function* streamChat(messages) {
  try {
    const stream = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile', // fast and free
      temperature: 0.3,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) yield token;
    }
  } catch (error) {
    console.error('Groq stream error:', error);
    throw new Error('Failed to stream chat');
  }
}

module.exports = { streamChat };