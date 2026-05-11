"use server";

import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { z } from 'zod';

const evaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("Numerical grade for clarity, correctness and concept coverage."),
  analysis: z.string().describe("Constructive feedback explaining gaps or successes in student logic."),
  found_concepts: z.array(z.string()).describe("Which of the expected concepts did the student actually articulate?"),
});

export async function evaluateOpenQuestion(
  questionText: string,
  studentAnswer: string,
  topic: string,
  expectedConcepts: string[],
  difficulty: string
) {
  const env = getRequestContext().env;
  
  // Fix: Initializing explicit provider instance with key per SDK requirement
  const googleProvider = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const { object } = await generateObject({
    model: googleProvider('gemini-1.5-flash'),
    schema: evaluationSchema,
    system: `You are an advanced academic grading assistant. 
    Review the student's answer based on the Topic and Expected Concepts list.
    Be fair but strict. Focus on pedagogical depth.
    Output only the structured grading object.`,
    prompt: `
      ---
      Topic: ${topic}
      Difficulty: ${difficulty}
      Expected Concepts User Should Touch: ${expectedConcepts.join(', ')}
      ---
      Question: ${questionText}
      Student Answer: "${studentAnswer}"
      ---
      Analyze the response and output the JSON result with feedback.
    `,
  });

  return object;
}
