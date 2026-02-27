import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

// This file provides a centralized, safely initialized instance of Genkit.
// It is NOT a server component and should not contain 'use server'.
// Other server components can import the 'ai' instance from here.

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});
