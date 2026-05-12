import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { assessments, units, courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { DynamicSimulator } from '@/components/simulation/dynamic-simulator';
import type { Question } from '@/lib/types/course';

export const runtime = 'edge';

export default async function SimulationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  // Load the exact assessment
  const test = await db.query.assessments.findFirst({
    where: eq(assessments.id, params.id),
  });

  if (!test) return notFound();

  // Lookup parents for context
  const unit = await db.query.units.findFirst({ where: eq(units.id, test.unitId) });
  const course = unit ? await db.query.courses.findFirst({ where: eq(courses.id, unit.courseId) }) : null;

  const questions: Question[] = JSON.parse(test.questionsJson);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <DynamicSimulator 
          testTitle={test.title}
          testType={test.type}
          courseName={course?.name || "Curso"} 
          questions={questions}
          assessmentId={test.id}
          courseId={course?.id || ""}
        />
      </main>
    </div>
  );
}
