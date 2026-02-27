import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

// This file is responsible for initializing the AI plugin.
// It is kept separate from the flow to avoid Next.js build conflicts.
export const ai = genkit({
  plugins: [googleAI()],
});
