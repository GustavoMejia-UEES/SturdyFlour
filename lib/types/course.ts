import { z } from 'zod';

export const RoleEnum = z.enum(['NEW', 'STUDENT', 'EDITOR', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

// 1. Question Structures
export const MultipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('MULTIPLE_CHOICE'),
    question_text: z.string(),
    image_url: z.string().optional(),
    options: z.array(MultipleChoiceOptionSchema),
    correct_id: z.union([z.string(), z.array(z.string())]),
    feedback_general: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('AI_OPEN_QUESTION'),
    question_text: z.string(),
    image_url: z.string().optional(),
    ai_context: z.object({
      topic: z.string(),
      expected_concepts: z.array(z.string()),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    }),
  })
]);

// 2. Assessment Hierarchy
export const AssessmentSchema = z.object({
  test_id: z.string(),
  test_title: z.string(),
  type: z.enum(['PRACTICE', 'GRADED']),
  questions: z.array(QuestionSchema),
});

// 3. Syllabus / Unit
export const UnitSchema = z.object({
  unit_id: z.string(),
  unit_title: z.string(),
  assessments: z.array(AssessmentSchema),
});

// 4. The Root Course Schema
export const CourseDefinitionSchema = z.object({
  course_id: z.string(),
  course_name: z.string(),
  instructor: z.string(),
  grade_level: z.string().optional(), // extra meta
  syllabus: z.array(UnitSchema),
});

export type CourseDefinition = z.infer<typeof CourseDefinitionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
