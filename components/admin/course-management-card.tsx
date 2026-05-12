"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { deleteCourse } from "@/lib/actions/admin";
import { Settings2, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function CourseManagementCard({ courseId, courseName, themeColor }: { courseId: string, courseName: string, themeColor?: string }) {
  const activeColor = themeColor || '#3b82f6'; // default blue-500
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Estás completamente seguro de que quieres borrar "${courseName}"? Esto eliminará todas sus unidades y evaluaciones PERMANENTEMENTE.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCourse(courseId);
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      alert("Error al eliminar: " + e.message);
      setIsDeleting(false);
    }
  }

  return (
    <Card className="shadow-lg overflow-hidden bg-white dark:bg-slate-900" style={{ borderColor: activeColor }}>
      <div className="h-1.5" style={{ backgroundColor: activeColor }} />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: activeColor }}>
          <Settings2 className="h-5 w-5" /> Panel de Control
        </CardTitle>
        <CardDescription>Herramientas de Gestión Administrativa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href={`/admin/import?courseId=${courseId}&name=${encodeURIComponent(courseName)}&c=${encodeURIComponent(activeColor)}`} className="w-full block">
          <Button className="w-full font-bold gap-2 shadow-sm transition-all hover:scale-[1.02]" style={{ backgroundColor: activeColor }}>
            <Plus className="h-4 w-4" /> Añadir Unidad / Quiz
          </Button>
        </Link>
        
        <div className="pt-2 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Eliminar este Curso
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
