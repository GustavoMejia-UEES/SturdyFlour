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
    console.error("Failed to load courses from D1", e);
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
              <Card key={course.id} className="group overflow-hidden border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-card rounded-3xl">
                <div 
                  className="h-2 w-full" 
                  style={{ backgroundColor: course.themeColor || '#2563eb' }}
                />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span 
                      className="text-xs font-mono px-2 py-1 rounded font-bold uppercase"
                      style={{ backgroundColor: `${course.themeColor || '#2563eb'}15`, color: course.themeColor || '#2563eb' }}
                    >
                      {course.code}
                    </span>
                    {course.gradeLevel && (
                      <span className="text-xs text-muted-foreground">{course.gradeLevel}</span>
                    )}
                  </div>
                  <CardTitle className="text-xl font-extrabold tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {course.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex items-center text-sm text-muted-foreground gap-2 bg-muted/50 p-2 rounded-lg border">
                    <User className="h-4 w-4" />
                    <span className="truncate font-medium">{course.instructor}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 pt-4">
                  <Link href={`/course/${course.id}`} className="w-full">
                    <Button className="w-full justify-between group-hover:bg-primary" variant="default">
                      Entrar al Módulo 
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
