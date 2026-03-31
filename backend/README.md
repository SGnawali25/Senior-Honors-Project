# AI Backend Service

This backend service accepts prompts from a frontend and queries three AI models: ChatGPT (OpenAI), Gemini (Google), and Grok (xAI). It returns the responses from all three.

## Setup

1. Clone or navigate to the project directory.

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   XAI_API_KEY=your_xai_api_key
   ```

   - Get OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Get Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Get xAI API key from [xAI Console](https://console.x.ai/team/default/api-keys)

4. Start the server:
   ```
   npm start
   ```
   Or for development:
   ```
   npm run dev
   ```

The server will run on `http://localhost:4000`.

## API Endpoint

### POST /api/prompt

Accepts a JSON payload with a `prompt` field.

**Request:**
```json
{
  "prompt": "Your prompt here"
}
```

**Response:**
```json
{
  "chatgpt": "Response from ChatGPT",
  "gemini": "Response from Gemini",
  "grok": "Response from Grok"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## Notes

- Ensure all API keys are valid and have sufficient credits.
- The service uses GPT-3.5-turbo for ChatGPT, gemini-1.5-flash for Gemini, and grok-4.20-beta-latest-non-reasoning for Grok. You can adjust models in `server.js` if needed.
- CORS is enabled for cross-origin requests from the frontend.