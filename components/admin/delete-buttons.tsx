"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUnit, deleteAssessment } from "@/lib/actions/admin";

export function DeleteUnitButton({ unitId, title }: { unitId: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar la Unidad "${title}"? Esto borrará permanentemente todas sus evaluaciones y registros.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteUnit(unitId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Fallo al borrar la unidad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all duration-150 inline-flex items-center justify-center disabled:opacity-50 ml-2"
      title="Eliminar Unidad Completa"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

export function DeleteAssessmentButton({ assessmentId, title }: { assessmentId: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar la evaluación "${title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteAssessment(assessmentId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Fallo al borrar la evaluación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
      title="Eliminar Evaluación"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
