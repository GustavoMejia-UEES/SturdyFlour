"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUnit, deleteAssessment } from "@/lib/actions/admin";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function DeleteUnitButton({ unitId, title }: { unitId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      await deleteUnit(unitId);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Fallo al borrar la unidad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all duration-150 inline-flex items-center justify-center ml-2"
        title="Eliminar Unidad Completa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        isLoading={loading}
        title="¿Eliminar Unidad Completa?"
        description={`¿Estás completamente seguro de eliminar la Unidad "${title}"? Esta acción es irreversible y borrará permanentemente todas sus evaluaciones y registros de estudiantes.`}
        confirmText="Sí, Eliminar Unidad"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}

export function DeleteAssessmentButton({ assessmentId, title }: { assessmentId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      await deleteAssessment(assessmentId);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Fallo al borrar la evaluación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
        title="Eliminar Evaluación"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        isLoading={loading}
        title="¿Eliminar Evaluación?"
        description={`¿Estás seguro de que deseas borrar "${title}"? Los estudiantes no podrán acceder a esta simulación en el futuro.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}
