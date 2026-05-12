import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- USER & PERMISSIONS ---
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').$type<'NEW' | 'STUDENT' | 'EDITOR' | 'ADMIN'>().default('NEW').notNull(),
  stars: integer('stars').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- ACADEMIC STRUCTURE ---
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(), // e.g., PY-101
  name: text('name').notNull(),
  instructor: text('instructor').notNull(),
  gradeLevel: text('grade_level'),
  themeColor: text('theme_color').default('#2563eb'), // Default tailwind blue-600
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  customId: text('custom_id').notNull(), // The user's JSON id e.g. "W1"
  title: text('title').notNull(),
  orderIndex: integer('order_index').default(0),
}, (table) => ({
  courseIdx: index('unit_course_idx').on(table.courseId),
}));

// --- ASSESSMENTS & TESTING ---
export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  customId: text('custom_id').notNull(), // "T1-W1"
  title: text('title').notNull(),
  type: text('type').$type<'PRACTICE' | 'GRADED'>().notNull(),
  questionsJson: text('questions_json').notNull(), // Stores full validated list for quick delivery
}, (table) => ({
  unitIdx: index('assessment_unit_idx').on(table.unitId),
}));

// --- INTERACTIONS & SCORING ---
export const likes = sqliteTable('likes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessmentId: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  assessUserIdx: index('like_user_idx').on(table.assessmentId, table.userId),
}));

// Simplified Scoreboard - Highest achieved score per student
export const maxScores = sqliteTable('max_scores', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  assessmentId: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  uniqueUserAssess: index('unique_user_assess_idx').on(table.userId, table.assessmentId),
}));
