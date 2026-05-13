"use server";

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '../db';
import { profiles, courses, units, assessments, likes, maxScores } from '../db/schema';
import { CourseDefinitionSchema } from '../types/course';
import { requireRole } from '../auth/session';
import { eq, inArray, sql, asc } from 'drizzle-orm';

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
export async function createCourse(data: { code: string, name: string, instructor: string, gradeLevel?: string, themeColor?: string }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    const [res] = await db.insert(courses).values({
      code: data.code,
      name: data.name,
      instructor: data.instructor,
      gradeLevel: data.gradeLevel || null,
      themeColor: data.themeColor || '#2563eb',
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
    // Validate parent exists using standard select to avoid missing-column errors
    const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)).limit(1);
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
 * Fetches all existing Units for a given course to populate visual editor selectors.
 */
export async function getCourseUnits(courseId: string) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    const courseUnits = await db.select({
      id: units.id,
      customId: units.customId,
      title: units.title
    })
    .from(units)
    .where(eq(units.courseId, courseId))
    .orderBy(asc(units.orderIndex))
    .all();

    return courseUnits;
  } catch (e: any) {
    throw new Error(`Fallo al recuperar unidades: ${e.message}`);
  }
}

/**
 * Surgically injects a brand-new assessment into an already existing Unit node.
 */
export async function addAssessmentToExistingUnit(unitId: string, data: any) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    // Ensure the unit exists
    const [targetUnit] = await db.select({ id: units.id }).from(units).where(eq(units.id, unitId)).limit(1);
    if (!targetUnit) throw new Error("Unidad de destino no encontrada.");

    await db.insert(assessments).values({
      unitId,
      customId: data.test_id || `T${Date.now().toString().slice(-4)}`,
      title: data.test_title,
      type: data.type || "PRACTICE",
      questionsJson: JSON.stringify(data.questions || []),
    });

    return { success: true };
  } catch (e: any) {
    throw new Error(`Fallo al añadir evaluación: ${e.message}`);
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
    // 1. Find all associated Units
    const unitRows = await db.select({ id: units.id }).from(units).where(eq(units.courseId, courseId)).all();
    const unitIds = unitRows.map(u => u.id);

    if (unitIds.length > 0) {
      // 2. Find all associated Assessments
      const assessRows = await db.select({ id: assessments.id })
        .from(assessments)
        .where(inArray(assessments.unitId, unitIds))
        .all();
      const assessIds = assessRows.map(a => a.id);

      if (assessIds.length > 0) {
        // 3. Wipe lower-level dependent interactions
        await db.delete(likes).where(inArray(likes.assessmentId, assessIds));
        await db.delete(maxScores).where(inArray(maxScores.assessmentId, assessIds));
        
        // 4. Wipe Assessments themselves
        await db.delete(assessments).where(inArray(assessments.id, assessIds)); 
      }
      
      // 5. Wipe Units
      await db.delete(units).where(inArray(units.id, unitIds));
    }

    // 6. Wipe the main course node
    await db.delete(courses).where(eq(courses.id, courseId));
    
    return { success: true };
  } catch (e: any) {
    throw new Error(`Fallo al eliminar: ${e.message}`);
  }
}

/**
 * Surgical retrieval of a single assessment for the client-side visual editor
 */
export async function getAssessmentData(assessmentId: string) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  const [data] = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1);
  if (!data) throw new Error("Evaluación no encontrada");
  
  // Also find parent unit title for context using safe select
  const [parentUnit] = await db.select().from(units).where(eq(units.id, data.unitId)).limit(1);

  return {
    id: data.id,
    customId: data.customId,
    title: data.title,
    type: data.type,
    questions: JSON.parse(data.questionsJson),
    unitTitle: parentUnit?.title || "",
    unitId: parentUnit?.id || ""
  };
}

/**
 * Surgical edit of an existing assessment
 */
export async function editAssessmentContent(assessmentId: string, data: { title: string, type: 'PRACTICE' | 'GRADED', questions: any[] }) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    await db.update(assessments).set({
      title: data.title,
      type: data.type,
      questionsJson: JSON.stringify(data.questions)
    }).where(eq(assessments.id, assessmentId));

    return { success: true };
  } catch (e: any) {
    throw new Error(`Error actualizando evaluación: ${e.message}`);
  }
}

/**
 * Deletes a single assessment surgically
 */
export async function deleteAssessment(assessmentId: string) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    // Wipe dependent metrics first
    await db.delete(likes).where(eq(likes.assessmentId, assessmentId));
    await db.delete(maxScores).where(eq(maxScores.assessmentId, assessmentId));
    
    // Wipe the node itself
    await db.delete(assessments).where(eq(assessments.id, assessmentId));

    return { success: true };
  } catch (e: any) {
    throw new Error(`Error al eliminar la evaluación: ${e.message}`);
  }
}
/**
 * Deletes a single unit surgically, cascading into its assessments and interactions
 */
export async function deleteUnit(unitId: string) {
  await requireRole(['ADMIN', 'EDITOR']);
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  try {
    // 1. Find all associated Assessments
    const assessRows = await db.select({ id: assessments.id })
      .from(assessments)
      .where(eq(assessments.unitId, unitId))
      .all();
    const assessIds = assessRows.map(a => a.id);

    if (assessIds.length > 0) {
      // 2. Wipe lower-level dependent interactions
      await db.delete(likes).where(inArray(likes.assessmentId, assessIds));
      await db.delete(maxScores).where(inArray(maxScores.assessmentId, assessIds));
      
      // 3. Wipe Assessments themselves
      await db.delete(assessments).where(inArray(assessments.id, assessIds));
    }

    // 4. Wipe the Unit node itself
    await db.delete(units).where(eq(units.id, unitId));

    return { success: true };
  } catch (e: any) {
    throw new Error(`Error al eliminar la unidad: ${e.message}`);
  }
}
