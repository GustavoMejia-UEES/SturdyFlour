"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse } from "@/lib/actions/admin";
import { PlusCircle, Loader2, BookPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateCourseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    name: "",
    instructor: "",
    gradeLevel: ""
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.name || !form.instructor) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createCourse(form);
      setIsOpen(false);
      setForm({ code: "", name: "", instructor: "", gradeLevel: "" });
      router.push(`/course/${res.courseId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al crear curso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="gap-2 shadow-md font-bold bg-slate-900 hover:bg-slate-800 text-white">
          <PlusCircle className="h-4 w-4" /> Crear Nuevo Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><BookPlus className="h-5 w-5 text-blue-600" /> Crear Curso Nuevo</DialogTitle>
          <DialogDescription>
            Ingresa los metadatos base. Luego podrás cargar sus unidades y evaluaciones.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {error && <div className="text-xs p-2 bg-red-50 text-red-600 rounded border border-red-100">{error}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="code">Código Único (Ej: MATH-101)*</Label>
            <Input id="code" placeholder="MAT-101" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Curso*</Label>
            <Input id="name" placeholder="Cálculo Diferencial" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instructor">Nombre del Docente*</Label>
            <Input id="instructor" placeholder="Ing. Juan Pérez" value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} disabled={loading} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="level">Período / Nivel (Opcional)</Label>
            <Input id="level" placeholder="Ciclo I - 2026" value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} disabled={loading} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Cascarón de Curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
