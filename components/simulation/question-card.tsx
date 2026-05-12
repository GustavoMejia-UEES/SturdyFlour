"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Question } from "@/lib/types/course";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { markdownComponents } from "./unified-simulator";

interface Props {
  question: Question;
  value?: any;
  onChange?: (val: any) => void;
  disabled?: boolean;
}

export function QuestionVisualCard({ question, value, onChange, disabled }: Props) {
  return (
    <Card className="shadow-xl border-border/60 bg-white min-h-[300px] flex flex-col w-full max-w-3xl mx-auto">
      <CardHeader className="pb-6 border-b bg-slate-50/50">
        <div className="flex gap-2 mb-2">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
            question.type === 'AI_OPEN_QUESTION' ? "bg-indigo-100 text-indigo-800 border-indigo-200" : "bg-blue-100 text-blue-800 border-blue-200"
          )}>
            {question.type === 'AI_OPEN_QUESTION' ? 'Respuesta Abierta (IA)' : 'Selección Múltiple'}
          </span>
        </div>
        <CardTitle className="text-xl md:text-2xl font-bold leading-tight text-slate-800 prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{question.question_text || "*(Sin título todavía)*"}</ReactMarkdown>
        </CardTitle>
        {question.image_url && (
          <div className="mt-4 rounded-xl overflow-hidden border bg-black/5 max-h-[300px] flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={question.image_url} 
              alt="Contexto" 
              className="object-contain max-h-[300px] w-auto"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 py-8 px-6 md:px-10">
        {question.type === 'MULTIPLE_CHOICE' ? (
          <div className="grid gap-3">
            {(() => {
              const isMulti = Array.isArray(question.correct_id);
              const currentSelected = value || (isMulti ? [] : null);
              
              const toggleOption = (optId: string) => {
                if (disabled) return;
                if (isMulti) {
                  const currentArr = Array.isArray(currentSelected) ? currentSelected : [];
                  const next = currentArr.includes(optId) 
                    ? currentArr.filter((i: any) => i !== optId)
                    : [...currentArr, optId];
                  onChange?.(next);
                } else {
                  onChange?.(optId);
                }
              };

              const isSelected = (optId: string) => {
                 return isMulti 
                  ? Array.isArray(currentSelected) && currentSelected.includes(optId)
                  : currentSelected === optId;
              };

              return question.options.length > 0 ? question.options.map((opt) => (
                <button 
                  type="button"
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  disabled={disabled}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium flex items-start gap-4 group",
                    isSelected(opt.id)
                      ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 shrink-0 flex items-center justify-center transition-colors mt-0.5",
                    isMulti ? "rounded-md border-2" : "rounded-full border-2",
                    isSelected(opt.id) ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-slate-400"
                  )}>
                    {isSelected(opt.id) && (
                      isMulti ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="prose prose-slate prose-sm leading-snug">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{opt.text || "Opción sin texto"}</ReactMarkdown>
                  </div>
                </button>
              )) : <div className="text-center py-4 text-slate-400 italic">Añade opciones para verlas aquí.</div>;
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-lg text-sm border border-indigo-100 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-indigo-900 block mb-1">Contexto para la IA</span>
                <p className="text-indigo-800/80 leading-relaxed">
                  La IA validará conceptos relacionados con: <strong className="text-indigo-900">{(question as any).ai_context?.topic || "Sin definir"}</strong>.
                </p>
              </div>
            </div>
            <Textarea 
              placeholder="Escribe aquí tu explicación detallada..."
              className="min-h-[200px] text-base resize-none border-2 focus-visible:ring-indigo-500"
              value={value || ""}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
