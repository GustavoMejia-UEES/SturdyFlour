import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { courses, units, assessments } from '@/lib/db/schema';
import { Navbar } from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { eq, asc } from 'drizzle-orm';
import { ArrowLeft, BookOpen, GraduationCap, PlayCircle, HelpCircle, Target, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { getAuthenticatedProfile } from '@/lib/auth/session';
import { CourseManagementCard } from '@/components/admin/course-management-card';

export const runtime = 'edge';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const env = getRequestContext().env;
  const db = getDb(env.DB);
  const [course] = await db.select({ name: courses.name }).from(courses).where(eq(courses.id, params.id)).limit(1);
  return { title: course ? course.name : 'Curso' };
}

export default async function CourseDetailPage(props: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile();
  const params = await props.params;
  const env = getRequestContext().env;
  const db = getDb(env.DB);

  let course;
  try {
    [course] = await db.select().from(courses)
      .where(eq(courses.id, params.id))
      .limit(1);
  } catch (err) {
    // Fallback query ignoring newly added dynamic styling columns
    const [fallback] = await db.select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      instructor: courses.instructor,
      gradeLevel: courses.gradeLevel,
    }).from(courses).where(eq(courses.id, params.id)).limit(1);
    course = fallback ? { ...fallback, themeColor: '#2563eb' } : null;
  }

  if (!course) return notFound();

  // Fetch Units Ordered
  const courseUnits = await db.select().from(units)
    .where(eq(units.courseId, params.id))
    .orderBy(asc(units.orderIndex)).all();

  // Grouping everything manually for high performance delivery
  const unitsWithAssessments = await Promise.all(courseUnits.map(async (u) => {
    const tests = await db.select().from(assessments).where(eq(assessments.unitId, u.id)).all();
    return { ...u, assessments: tests };
  }));

  const themeHex = course.themeColor || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar />
      
      {/* Hero Banner for Course */}
      <div 
        className="relative overflow-hidden text-white py-16 shadow-inner"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, ${themeHex}aa 100%), #0f172a` }}
      >
        {/* Aesthetic glowing circle using the dynamic color */}
        <div 
          className="absolute top-0 right-0 h-64 w-64 rounded-full blur-[120px] opacity-40 pointer-events-none translate-x-1/3 -translate-y-1/3"
          style={{ backgroundColor: themeHex }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors mb-6 font-medium">
            <ArrowLeft className="h-4 w-4" /> Catálogo General
          </Link>
          <div className="flex gap-3 mb-4">
            <span 
              className="px-3 py-1 rounded text-xs font-extrabold font-mono tracking-wide uppercase shadow-sm border border-white/10"
              style={{ backgroundColor: themeHex }}
            >
              {course.code}
            </span>
            {course.gradeLevel && <span className="bg-slate-800/80 px-3 py-1 rounded text-xs font-medium border border-white/5">{course.gradeLevel}</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 drop-shadow-sm">{course.name}</h1>
          <p className="text-slate-200 text-lg flex items-center gap-2 drop-shadow-sm">
             Docente: <span className="text-white font-bold border-b border-white/30 pb-0.5">{course.instructor}</span>
          </p>
        </div>
      </div>

      <main className="container mx-auto py-12 px-4 max-w-5xl flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="h-6 w-6" style={{ color: themeHex }} /> Malla de Contenidos
            </h2>
          </div>

          {unitsWithAssessments.length === 0 ? (
            <div className="p-8 border bg-white rounded-xl text-center text-muted-foreground">
              Este curso aún no cuenta con unidades cargadas en el Syllabus.
            </div>
          ) : (
            <div className="space-y-12 border-l-2 border-slate-200 pl-6 ml-3 relative">
              {unitsWithAssessments.map((unit, idx) => (
                <div key={unit.id} className="relative">
                  {/* Timeline dot with dynamic color */}
                  <div 
                    className="absolute -left-[33px] top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm" 
                    style={{ backgroundColor: themeHex }}
                  />
                  
                  <div className="mb-4">
                    <span 
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: themeHex }}
                    >
                      Unidad #{idx + 1} ({unit.customId})
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-800">{unit.title}</h3>
                  </div>

                  <div className="grid gap-4">
                    {unit.assessments.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">No hay evaluaciones programadas.</div>
                    ) : (
                      unit.assessments.map((test) => (
                        <Card key={test.id} className="hover:border-slate-300 transition-all duration-200 border bg-white group shadow-sm hover:shadow">
                          <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: `${themeHex}10` }}>
                                {test.type === 'GRADED' ? (
                                  <Target className="h-6 w-6" style={{ color: themeHex }} />
                                ) : (
                                  <BookOpen className="h-6 w-6" style={{ color: themeHex }} />
                                )}
                              </div>
                              <div>
                                <div className="flex gap-2 items-center mb-1">
                                  <span className="text-[10px] font-bold font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase tracking-wide border">
                                    {test.customId}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                    test.type === 'GRADED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {test.type === 'GRADED' ? 'Sumativa' : 'Práctica'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{test.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Preguntas interactivas + Feedback IA</p>
                              </div>
                            </div>
                            <Link href={`/simulation/${test.id}`}>
                              <Button 
                                size="sm" 
                                className="font-bold gap-2 group-hover:scale-105 transition-transform shadow-sm text-white border-0" 
                                style={{ backgroundColor: themeHex }}
                              >
                                Iniciar <PlayCircle className="h-4 w-4" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar for extras / metrics */}
        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* Admin Controls IF applicable */}
            {(profile?.role === 'EDITOR' || profile?.role === 'ADMIN') && (
              <CourseManagementCard courseId={course.id} courseName={course.name} />
            )}

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none overflow-hidden shadow-xl relative">
              <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-blue-400" />
                  Resumen Académico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-slate-300">Total Unidades</span>
                  <span className="font-bold font-mono text-lg">{unitsWithAssessments.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-slate-300">Total Pruebas</span>
                  <span className="font-bold font-mono text-lg">
                    {unitsWithAssessments.reduce((acc, cur) => acc + cur.assessments.length, 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg leading-relaxed">
                  Completa todas las unidades para validar tu conocimiento completo sobre {course.name}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
