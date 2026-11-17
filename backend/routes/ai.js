
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Working model first, backup model second
const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash'
];

// Set timeout based on question length
function getTimeout(message) {
  const length = message.trim().length;

  if (length <= 100) return 15000;
  if (length <= 300) return 25000;
  if (length <= 700) return 40000;

  return 60000;
}

// Check temporary and quota errors
function isRetryableError(error) {
  const message = String(error?.message || '');

  return (
    error?.name === 'AbortError' ||
    message.toLowerCase().includes('aborted') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota exceeded') ||
    message.includes('"code":429') ||
    [408, 429, 500, 502, 503, 504].includes(Number(error?.status)) ||
    message.includes('fetch failed') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT')
  );
}

// Generate response using primary and fallback models
async function generateAIResponse(ai, contents) {
  let lastError;

  for (const model of MODELS) {
    try {
      console.log(`Trying ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: `
You are CareerPath AI, a friendly and knowledgeable career guidance assistant.

Help students with:

1. Career Guidance
- Suggest suitable career options.
- Explain career opportunities.
- Help students choose career paths.

2. Skills Guidance
- Explain technical and non-technical skills.
- Identify skills required for different careers.
- Suggest ways to improve skills.

3. Learning Roadmaps
- Create step-by-step learning plans.
- Recommend beginner-friendly topics.
- Suggest practical projects.

4. Programming Help
- Explain programming concepts.
- Provide simple code examples.
- Help students understand programming errors.

5. Courses and Resources
- Recommend free learning resources.
- Suggest useful documentation and tutorials.
- Do not invent course links.

6. Interview Preparation
- Explain interview topics.
- Provide practice questions.
- Give preparation tips.

IMPORTANT RESPONSE RULES:
- Understand the complete user question.
- Use previous conversation when relevant.
- Answer the exact question asked.
- Avoid unrelated information.
- Use simple, beginner-friendly English.
- Organize answers using headings and bullet points.
- Give examples wherever useful.
- Do not invent facts or links.
- If unsure, clearly say so.
- Be friendly, professional and helpful.
          `,
          temperature: 0.5,
          maxOutputTokens: 1200
        }
      });

      const reply = response.text;

      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      console.log(`Response generated using ${model}`);

      return reply.trim();

    } catch (error) {
      lastError = error;

      console.error(
        `Gemini error (${model}):`,
        error.message
      );

      if (!isRetryableError(error)) {
        throw error;
      }

      console.log(`Moving to next model after ${model} failed.`);
    }
  }

  throw lastError;
}

// AI Chat API
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    // Validate user message
    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a message.'
      });
    }

    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured.'
      });
    }

    // Calculate timeout based on question length
    const timeout = getTimeout(message);

    console.log(
      `AI request timeout: ${timeout / 1000} seconds`
    );

    // Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        timeout,
        retryOptions: {
          attempts: 1
        }
      }
    });

    // Prepare conversation history
    const contents = [];

    function addMessage(role, content) {
      const previous = contents[contents.length - 1];

      // Merge consecutive messages with the same role
      if (previous && previous.role === role) {
        previous.parts[0].text += '\n' + content;
      } else {
        contents.push({
          role,
          parts: [{ text: content }]
        });
      }
    }

    if (Array.isArray(history)) {
      history.slice(-10).forEach(item => {
        if (
          ['user', 'assistant', 'model'].includes(item?.role) &&
          typeof item?.content === 'string' &&
          item.content.trim()
        ) {
          const role =
            item.role === 'assistant' || item.role === 'model'
              ? 'model'
              : 'user';

          addMessage(
            role,
            item.content.trim().slice(0, 3000)
          );
        }
      });
    }

    // Add latest user message
    addMessage(
      'user',
      message.trim().slice(0, 4000)
    );

    // Generate AI response
    const reply = await generateAIResponse(ai, contents);

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);

    if (isRetryableError(error)) {
      return res.status(503).json({
        success: false,
        message:
          'Gemini AI is temporarily busy or quota is exhausted. Please try again later.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'AI Assistant could not process your request. Please try again.'
    });
  }
});

export default router;
