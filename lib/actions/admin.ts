"use server";

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '../db';
import { profiles, courses, units, assessments } from '../db/schema';
import { CourseDefinitionSchema } from '../types/course';
import { requireRole } from '../auth/session';

export async function uploadCourseDefinition(rawJson: string) {
  // ... existing full upload function ...
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);
  let parsed;
  try {
    const json = JSON.parse(rawJson);
    parsed = CourseDefinitionSchema.parse(json);
  } catch (e: any) {
    throw new Error(`Validation Failed: ${e.message}`);
  }
  try {
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

/**
 * Creates just the empty shell of a course.
 */
export async function createCourse(data: { code: string, name: string, instructor: string, gradeLevel?: string }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    const [res] = await db.insert(courses).values({
      code: data.code,
      name: data.name,
      instructor: data.instructor,
      gradeLevel: data.gradeLevel || null,
    }).returning({ id: courses.id });
    
    return { success: true, courseId: res.id };
  } catch (e: any) {
    if (e.message && e.message.includes('UNIQUE constraint')) {
      throw new Error("Ese Código de Curso ya existe. Usa otro o edítalo.");
    }
    throw new Error(`Fallo al crear curso: ${e.message}`);
  }
}

/**
 * Appends one single Unit + Assessment to a preexisting course.
 */
export async function addUnitToCourse(courseId: string, data: any) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    // Validate parent exists
    const course = await db.query.courses.findFirst({
      where: (c, { eq }) => eq(c.id, courseId)
    });
    if (!course) throw new Error("Curso no encontrado");

    // Find current highest orderIndex for positioning
    const existingUnits = await db.select({ id: units.id }).from(units).where(eq(units.courseId, courseId)).all();
    
    const [insertedUnit] = await db.insert(units).values({
      courseId,
      customId: data.unit_id || `U${existingUnits.length + 1}`,
      title: data.unit_title,
      orderIndex: existingUnits.length,
    }).returning({ id: units.id });

    if (data.assessments && Array.isArray(data.assessments)) {
      for (const a of data.assessments) {
        await db.insert(assessments).values({
          unitId: insertedUnit.id,
          customId: a.test_id,
          title: a.test_title,
          type: a.type,
          questionsJson: JSON.stringify(a.questions),
        });
      }
    }

    return { success: true };
  } catch (e: any) {
    throw new Error(`Fallo al añadir unidad: ${e.message}`);
  }
}

/**
 * Decimates a full course and cascading cascade drops all relations automatically.
 */
export async function deleteCourse(courseId: string) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    await db.delete(courses).where(eq(courses.id, courseId));
    return { success: true };
  } catch (e: any) {
    throw new Error(`Fallo al eliminar: ${e.message}`);
  }
}
