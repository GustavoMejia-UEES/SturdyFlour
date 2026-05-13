"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  isLoading = false
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden p-0 bg-white rounded-2xl shadow-2xl border-none gap-0">
        <div className="p-6">
          <div className="flex gap-4 items-start">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
              variant === "destructive" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-none">{title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed mt-1.5">{description}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="font-semibold text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 h-11 rounded-xl px-5 transition-all"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`font-bold h-11 rounded-xl px-5 shadow-sm border-0 transition-all flex items-center justify-center gap-2 ${
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white hover:shadow"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
