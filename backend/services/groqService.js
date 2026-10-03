const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Stream chat completions using Groq API
 */
async function* streamChat(messages) {
  try {
    const stream = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      temperature: 0.3,
      max_tokens: 1024,
      reasoning_effort: 'low',
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) yield token;
    }
  } catch (error) {
    console.error('Groq stream error:', error.error?.error?.message || error.message);
    throw new Error('Failed to stream chat');
  }
}

module.exports = { streamChat };