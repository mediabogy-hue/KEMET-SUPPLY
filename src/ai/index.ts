import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

// This file initializes the AI tools.
// It is NOT a server action and should not have 'use server'.
export const ai = genkit({
  plugins: [googleAI()],
});
