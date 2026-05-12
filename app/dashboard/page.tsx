import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, User, ChevronRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { getAuthenticatedProfile } from '@/lib/auth/session';
import { Metadata } from 'next';
import { CreateCourseDialog } from '@/components/admin/create-course-dialog';

export const metadata: Metadata = {
  title: 'Catálogo de Cursos',
};

export const runtime = 'edge';

export default async function DashboardPage() {
  // Ensure the user profile exists in DB automatically upon hitting the dashboard
  const profile = await getAuthenticatedProfile();
  
  const env = getRequestContext().env;
  const db = getDb(env.DB);
  let courseList: (typeof courses.$inferSelect)[] = [];

  try {
    courseList = await db.select().from(courses).orderBy(desc(courses.createdAt)).all();
  } catch (e) {
    // Fallback for missing-column safe retrieval
    const fallbackList = await db.select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      instructor: courses.instructor,
      gradeLevel: courses.gradeLevel,
    }).from(courses).orderBy(desc(courses.createdAt)).all();
    
    courseList = fallbackList.map(c => ({ ...c, themeColor: '#2563eb', createdAt: null }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold tracking-wider uppercase mb-1">
              <LayoutDashboard className="h-4 w-4" /> Academia
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Catálogo de Cursos</h1>
            <p className="text-muted-foreground mt-1">Explora la malla curricular y mide tus conocimientos.</p>
          </div>

          {/* Show the admin button ONLY if profile is editor/admin */}
          {(profile?.role === 'EDITOR' || profile?.role === 'ADMIN') && (
            <CreateCourseDialog />
          )}
        </div>

        {courseList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed rounded-3xl text-center bg-card shadow-inner">
            <div className="bg-muted p-4 rounded-full mb-4">
              <GraduationCap className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Aún no hay cursos registrados</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              Los administradores no han subido la estructura del plan de estudios todavía.
            </p>
            <Link href="/admin/import">
              <Button>Subir Primer Curso</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courseList.map((course) => (
              <Link href={`/course/${course.id}`} key={course.id} className="group flex flex-col h-full">
                <Card className="h-full flex flex-col overflow-hidden border-0 shadow-[0_8px_30px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2 rounded-[2rem] relative bg-white dark:bg-slate-900 border-t-4" style={{ borderTopColor: course.themeColor || '#2563eb' }}>
                  
                  {/* HIGH IMPACT VISUAL HEADER */}
                  <div 
                    className="h-44 w-full relative flex items-center justify-center overflow-hidden group-hover:saturate-150 transition-all duration-700"
                    style={{ backgroundColor: `${course.themeColor || '#2563eb'}15` }}
                  >
                    {/* Visual background noise/pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-multiply" />
                    
                    {/* GIANT DECORATIVE BACKGROUND CODE */}
                    <div 
                      className="absolute -right-4 -bottom-8 text-8xl font-black opacity-10 rotate-12 select-none transition-transform duration-700 group-hover:translate-x-4"
                      style={{ color: course.themeColor || '#2563eb' }}
                    >
                      {course.code?.slice(0,3).toUpperCase() || "CRS"}
                    </div>

                    <div className="relative z-10 text-center px-6 w-full">
                      <div 
                        className="inline-flex text-[10px] font-black tracking-widest uppercase mb-2 px-3 py-1 rounded-full border"
                        style={{ 
                          backgroundColor: `${course.themeColor || '#2563eb'}20`, 
                          borderColor: `${course.themeColor || '#2563eb'}30`,
                          color: course.themeColor || '#2563eb' 
                        }}
                      >
                        {course.code}
                      </div>
                      <h3 
                        className="text-2xl font-black leading-tight tracking-tight line-clamp-3 text-slate-900 dark:text-white"
                      >
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* CONTENT AREA */}
                  <CardContent className="p-6 flex-1 flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800 duration-500">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
                        style={{ backgroundColor: course.themeColor || '#2563eb' }}
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Docente</p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">{course.instructor || 'Docente General'}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1 font-medium">
                      {course.gradeLevel ? `Periodo Académico: ${course.gradeLevel}. ` : ''}
                      Módulo de práctica dinámico con retroalimentación de IA y acceso continuo.
                    </p>
                  </CardContent>

                  {/* ACTION BAR */}
                  <CardFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center group-hover:bg-white dark:group-hover:bg-slate-800 transition-all duration-300">
                    <span className="text-xs font-black tracking-widest uppercase flex items-center gap-2 group-hover:gap-3 transition-all" style={{ color: course.themeColor || '#2563eb' }}>
                      Entrar al Módulo <ChevronRight className="h-4 w-4" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
