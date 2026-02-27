import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * The core Genkit instance.
 *
 * This is initialized once and exported for use in other parts of the application,
 * such as in server actions or API routes. This singleton pattern prevents
 * re-initialization on every request or module import.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
