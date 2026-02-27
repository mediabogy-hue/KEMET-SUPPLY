'use server';

import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Centralized Genkit initialization.
 * This ensures that Genkit is configured once in a server-only context.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
