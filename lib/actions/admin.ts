"use server";

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '../db';
import { profiles, courses, units, assessments } from '../db/schema';
import { CourseDefinitionSchema } from '../types/course';
import { requireRole } from '../auth/session';

export async function uploadCourseDefinition(rawJson: string) {
  // 1. HIGH LEVEL SECURITY CHECK - Validates user role in single consolidated call
  await requireRole(['ADMIN', 'EDITOR']);

  const env = getRequestContext().env;
  const db = getDb(env.DB);

  // 2. VALIDATION
  let parsed;
  try {
    const json = JSON.parse(rawJson);
    parsed = CourseDefinitionSchema.parse(json); // Throws ZodError if incorrect
  } catch (e: any) {
    throw new Error(`Validation Failed: ${e.message || "Invalid JSON format"}`);
  }

  // 3. TRANSACTIONAL INSERT (Using D1 Batch concept, or standard Drizzle)
  // Note: Cloudflare D1 batching is optimized for multiple inserts
  
  try {
    // Create Course
    const [insertedCourse] = await db.insert(courses).values({
      code: parsed.course_id,
      name: parsed.course_name,
      instructor: parsed.instructor,
      gradeLevel: parsed.grade_level || null,
    }).onConflictDoUpdate({ 
      target: courses.code, 
      set: { name: parsed.course_name, instructor: parsed.instructor } 
    }).returning({ id: courses.id });

    const targetCourseId = insertedCourse.id;

    for (let uIndex = 0; uIndex < parsed.syllabus.length; uIndex++) {
      const u = parsed.syllabus[uIndex];
      
      const [insertedUnit] = await db.insert(units).values({
        courseId: targetCourseId,
        customId: u.unit_id,
        title: u.unit_title,
        orderIndex: uIndex,
      }).returning({ id: units.id });

      for (const a of u.assessments) {
        await db.insert(assessments).values({
          unitId: insertedUnit.id,
          customId: a.test_id,
          title: a.test_title,
          type: a.type,
          questionsJson: JSON.stringify(a.questions),
        });
      }
    }

    return { success: true, courseId: targetCourseId };
  } catch (e: any) {
    throw new Error(`Database Sync Failed: ${e.message}`);
  }
}
