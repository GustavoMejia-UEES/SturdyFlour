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
            <div className="flex items-center gap-2 text-primary text-sm font-bold tracking-wider uppercase mb-1">
              <GraduationCap className="h-4 w-4" /> Catálogo
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Mis Cursos</h1>
            <p className="text-muted-foreground mt-1">Pon a prueba tus conocimientos y revienta los exámenes.</p>
          </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {courseList.map((course) => (
              <Link href={`/course/${course.id}`} key={course.id} className="group flex flex-col h-full">
                <Card className="h-full flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 rounded-2xl relative bg-white dark:bg-slate-900">
                  
                  {/* HIGH IMPACT COMPACT HEADER */}
                  <div 
                    className="h-32 w-full relative flex items-center justify-center overflow-hidden group-hover:saturate-150 transition-all duration-700"
                    style={{ backgroundColor: course.themeColor || '#2563eb' }}
                  >
                    {/* Background Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-black/10 z-0" />

                    {/* GIANT DECORATIVE BACKGROUND CODE (EXTREMELY VISIBLE) */}
                    <div 
                      className="absolute -right-2 -bottom-4 text-7xl font-black opacity-30 text-white rotate-12 select-none transition-all duration-700 group-hover:translate-x-2 group-hover:scale-110"
                    >
                      {course.code?.slice(0,4).toUpperCase() || "CUR"}
                    </div>

                    <div className="relative z-10 text-center px-4 w-full text-white drop-shadow-sm">
                      <div className="text-[9px] font-black tracking-widest uppercase mb-1 opacity-70">
                        {course.code}
                      </div>
                      <h3 className="text-lg font-black leading-tight tracking-tight line-clamp-2 font-sans">
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* COMPACT INFO BAR */}
                  <CardContent className="p-4 flex-1 flex flex-col bg-white dark:bg-slate-900 gap-3 justify-between">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="text-xs font-bold truncate leading-tight">
                        {course.instructor || 'General'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {course.gradeLevel || 'Nivel U'}
                      </span>
                      <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1 transition-all duration-300 group-hover:gap-2" style={{ color: course.themeColor || '#2563eb' }}>
                        Entrar <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
