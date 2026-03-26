require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const grokClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Timeout wrapper
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after ' + ms + 'ms')), ms)
    ),
  ]);
};


app.post("/api/classify", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      }),
      60000
    );

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error("Classification error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prompt', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // ------------------------
    // ChatGPT
    // ------------------------
    const chatgptTask = (async () => {
      const start = Date.now();

      const response = await withTimeout(
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
        }),
        60000
      );

      return {
        model: 'gpt-4o',
        response: response.choices[0].message.content,
        latency: Date.now() - start,
      };
    })();

    // ------------------------
    // Gemini
    // ------------------------
    const geminiTask = (async () => {
      const start = Date.now();

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const result = await withTimeout(
        model.generateContent(prompt),
        60000
      );

      return {
        model: 'gemini-2.5-flash-lite',
        response: result.response.text(),
        latency: Date.now() - start,
      };
    })();

    // ------------------------
    // Grok
    // ------------------------
    const grokTask = (async () => {
      const start = Date.now();

      const response = await withTimeout(
        grokClient.chat.completions.create({
          model: 'grok-4.20-0309-reasoning', // safer model name
          messages: [{ role: 'user', content: prompt }],
        }),
        60000
      );

      return {
        model: 'grok-4.20',
        response: response.choices[0].message.content,
        latency: Date.now() - start,
      };
    })();

    // ------------------------
    // Run all in parallel
    // ------------------------
    const results = await Promise.allSettled([
      chatgptTask,
      geminiTask,
      grokTask,
    ]);

    const formatResult = (result, name) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          model: name,
          response: 'Error: ' + result.reason.message,
          latency: null,
        };
      }
    };

    const responsePayload = {
      chatgpt: formatResult(results[0], 'gpt-4o'),
      gemini: formatResult(results[1], 'gemini'),
      grok: formatResult(results[2], 'grok'),
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check (optional but useful)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});