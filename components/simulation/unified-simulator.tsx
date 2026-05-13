"use client";

import { useState } from "react";
import type { Question } from "@/lib/types/course";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Trophy, RefreshCw, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { evaluateOpenQuestion } from "@/lib/api/evaluator";
import Link from "next/link";
import { QuestionVisualCard } from "./question-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type AIResult = {
  score: number;
  analysis: string;
  found_concepts: string[];
}

// --- SHARED PREMIUM MARKDOWN RENDERER CONFIG ---
export const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (!inline && language) {
      return (
        <div className="group relative my-5 rounded-xl overflow-hidden border border-slate-700/50 bg-[#1E1E1E] shadow-xl ring-1 ring-white/5 font-sans">
          {/* Mac Window Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#191919] border-b border-[#333]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{language}</span>
          </div>
          {/* Code Body */}
          <div className="overflow-x-auto text-[13px] leading-relaxed font-mono">
            <SyntaxHighlighter
              // eslint-disable-next-line react/no-children-prop
              children={String(children).replace(/\n$/, '')}
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              customStyle={{ 
                margin: 0, 
                background: 'transparent', 
                padding: '1.25rem', 
                fontSize: '0.85rem',
                lineHeight: '1.5'
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <code className={cn("bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-200", className)} {...props}>
        {children}
      </code>
    );
  }
};
// ------------------------------------------------

export interface UnifiedSimulatorProps { 
  testTitle: string;
  testType?: string;
  courseName: string;
  questions: Question[];
  assessmentId?: string;
  courseId: string;
  themeColor?: string;
}

export function UnifiedSimulator({ testTitle, courseName, questions, courseId, themeColor = "#2563eb" }: UnifiedSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  
  // State for async AI evaluations results
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, AIResult>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});

  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Scoring Logic
  const calculateFinalScore = () => {
    let earnedPoints = 0;
    questions.forEach(q => {
      if (q.type === 'MULTIPLE_CHOICE') {
        const correctAnswers = Array.isArray(q.correct_id) ? [...q.correct_id].sort() : [q.correct_id];
        const userResp = userAnswers[q.id];
        const userArr = Array.isArray(userResp) ? [...userResp].sort() : [userResp];
        
        const isMatch = JSON.stringify(correctAnswers) === JSON.stringify(userArr);
        if (isMatch) earnedPoints += 100;
      } else if (q.type === 'AI_OPEN_QUESTION') {
        const val = aiEvaluations[q.id]?.score;
        earnedPoints += (val !== undefined && val >= 0 ? val : 0);
      }
    });
    return Math.round(earnedPoints / questions.length);
  };

  // The central pivot: triggering the AI server function!
  async function processOpenAnswer() {
    if (currentQuestion.type !== 'AI_OPEN_QUESTION') return;
    const answer = userAnswers[currentQuestion.id];
    if (!answer || answer.trim().length < 10) {
      alert("Por favor, escribe una respuesta más detallada.");
      return;
    }

    setEvaluating(true);
    try {
      const result = await evaluateOpenQuestion(
        currentQuestion.question_text,
        answer,
        currentQuestion.ai_context
      );
      
      setAiEvaluations(prev => ({ ...prev, [currentQuestion.id]: result as AIResult }));
      
      // Auto-advance if valid
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    } catch (error) {
      console.error("⚠️ AI Evaluator failed during exam flow:", error);
      // Set state to -1 representing 'pending/error' so they aren't blocked
      setAiEvaluations(prev => ({ 
        ...prev, 
        [currentQuestion.id]: { score: -1, analysis: "Pendiente", found_concepts: [] } 
      }));
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    } finally {
      setEvaluating(false);
    }
  }

  async function handleRetryEvaluation(q: Question) {
    if (q.type !== 'AI_OPEN_QUESTION') return;
    const answer = userAnswers[q.id];
    if (!answer) return;

    setRetryingIds(prev => ({ ...prev, [q.id]: true }));
    try {
      const result = await evaluateOpenQuestion(q.question_text, answer, q.ai_context);
      setAiEvaluations(prev => ({ ...prev, [q.id]: result as AIResult }));
    } catch (err) {
      console.error("🔴 Manual retry failed:", err);
      alert("El motor evaluador sigue sin responder. Por favor intenta de nuevo en un momento.");
    } finally {
      setRetryingIds(prev => ({ ...prev, [q.id]: false }));
    }
  }

  // RENDER RESULT VIEW
  if (showResults) {
    const finalScore = calculateFinalScore();
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Card className="border-t-8 overflow-hidden bg-white shadow-xl rounded-3xl text-center" style={{ borderTopColor: themeColor }}>
          <CardHeader className="pt-8 pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
              <Trophy className="text-blue-600 h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black">{finalScore >= 70 ? "¡Buen trabajo!" : "Sigue Estudiando"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-black text-primary mb-2 tracking-tighter">{finalScore}%</div>
            <p className="text-muted-foreground font-medium">{testTitle}</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-3 bg-slate-50 border-t py-4">
            <Link href={`/course/${courseId}`}>
              <Button variant="outline" className="font-semibold">Regresar al Curso</Button>
            </Link>
            <Button variant="secondary" onClick={() => window.location.reload()} className="gap-2 font-semibold">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" /> Informe de Resultados
          </h3>
          {questions.map((q, idx) => {
            if (q.type === 'AI_OPEN_QUESTION') {
              const evalRes = aiEvaluations[q.id];
              const isPending = !evalRes || evalRes.score === -1;
              const isRetrying = retryingIds[q.id];

              return (
                <Card key={q.id} className={cn(
                  "border-l-4 shadow-sm transition-all duration-500",
                  isPending ? "border-l-amber-500 bg-amber-50/5" : "border-l-indigo-500 bg-white"
                )}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h4 className="font-bold leading-tight prose prose-sm flex-1 max-w-3xl">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                          {`${idx+1}. ${q.question_text}`}
                        </ReactMarkdown>
                      </h4>
                      <span className={cn(
                        "font-mono text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-sm shrink-0 select-none",
                        isPending 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      )}>
                        {isPending ? "IA: PENDIENTE" : `IA SCORING: ${evalRes?.score}%`}
                      </span>
                    </div>
                    <div className="text-sm bg-slate-50 p-3.5 rounded-2xl border mb-3 italic text-slate-700 prose prose-sm max-w-none font-sans shadow-inner">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{`"${userAnswers[q.id]}"`}</ReactMarkdown>
                    </div>
                    
                    {isPending ? (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                        <div className="flex gap-3 items-start">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 animate-pulse">
                            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-amber-800 mb-0.5">Calificación en Cola de Espera</p>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">Hubo una congestión en la red. La respuesta está guardada correctamente, pero el motor evaluador no respondió a tiempo.</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={isRetrying}
                          onClick={() => handleRetryEvaluation(q)}
                          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 gap-2 text-xs font-bold shadow-sm shrink-0"
                        >
                          {isRetrying ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Solicitando...</>
                          ) : (
                            <><RefreshCw className="h-3.5 w-3.5" /> Forzar Calificación</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex gap-3.5 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 h-16 w-16 bg-indigo-200/20 rounded-full blur-xl pointer-events-none"></div>
                        <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-900 mb-2.5 font-sans flex items-center gap-1.5">
                            Evaluación Pedagógica
                          </p>
                          <div className="text-[13px] text-indigo-950/90 leading-relaxed font-medium font-sans prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                              {evalRes?.analysis || ""}
                            </ReactMarkdown>
                          </div>
                          {evalRes?.found_concepts && evalRes.found_concepts.length > 0 && (
                            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-indigo-100/60 pt-2.5">
                              {evalRes.found_concepts.map(c => (
                                <span key={c} className="text-[9px] uppercase font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md border border-indigo-700 shadow-sm shadow-indigo-600/10 tracking-wider font-mono">CONCEPT: {c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
            // MCQ Logic remains same but adapted to Schema labels
            const isMultipleCorrect = Array.isArray(q.correct_id);
            const correctSorted = isMultipleCorrect ? [...q.correct_id].sort() : [q.correct_id];
            const currentAns = userAnswers[q.id];
            const ansSorted = Array.isArray(currentAns) ? [...currentAns].sort() : [currentAns];
            const isCorrect = JSON.stringify(correctSorted) === JSON.stringify(ansSorted);

            return (
              <Card key={q.id} className={cn("border-l-4 shadow-sm bg-white", isCorrect ? "border-l-emerald-500" : "border-l-rose-500")}>
                 <CardContent className="p-5 md:p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h4 className="font-bold leading-tight text-slate-900 flex-1 prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                          {`${idx + 1}. ${q.question_text}`}
                        </ReactMarkdown>
                      </h4>
                      {isCorrect ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correcto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shrink-0">
                          <XCircle className="h-3.5 w-3.5" /> Incorrecto
                        </span>
                      )}
                    </div>

                    {/* Visual Audit of MCQ Options */}
                    <div className="space-y-2.5 mt-4 max-w-3xl">
                      {q.options?.map((opt: any) => {
                        const isOptSelected = Array.isArray(currentAns) ? currentAns.includes(opt.id) : currentAns === opt.id;
                        const isOptCorrect = Array.isArray(q.correct_id) ? q.correct_id.includes(opt.id) : q.correct_id === opt.id;

                        return (
                          <div 
                            key={opt.id} 
                            className={cn(
                              "flex items-start gap-3 p-3.5 rounded-2xl border text-[13px] font-medium leading-relaxed transition-all duration-300 font-sans",
                              isOptCorrect && isOptSelected && "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm ring-1 ring-emerald-500/10",
                              !isOptCorrect && isOptSelected && "bg-rose-50 border-rose-200 text-rose-900 shadow-sm",
                              isOptCorrect && !isOptSelected && "bg-teal-50/20 border-teal-200/60 text-slate-800 border-dashed",
                              !isOptCorrect && !isOptSelected && "bg-slate-50 border-slate-200 text-slate-500 opacity-70"
                            )}
                          >
                            <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-black bg-white font-mono shadow-sm">
                              {opt.id.toUpperCase()}
                            </div>
                            <div className="flex-1 prose prose-slate prose-sm max-w-none text-inherit font-inherit prose-p:m-0 leading-normal">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                                {opt.text}
                              </ReactMarkdown>
                            </div>
                            <div className="shrink-0 flex gap-1.5 ml-2 select-none">
                              {isOptSelected && isOptCorrect && (
                                <span className="text-[9px] font-black uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Tu Elección
                                </span>
                              )}
                              {isOptSelected && !isOptCorrect && (
                                <span className="text-[9px] font-black uppercase bg-rose-200 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Tu Elección
                                </span>
                              )}
                              {!isOptSelected && isOptCorrect && (
                                <span className="text-[9px] font-black uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Correcta
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.feedback_general && (
                      <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs p-3.5 rounded-xl mt-4 flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5 font-black uppercase tracking-wide text-[10px]">Explicación Detallada:</strong>
                          <span className="font-medium text-amber-800 leading-relaxed">{q.feedback_general}</span>
                        </div>
                      </div>
                    )}
                 </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // RENDER RUNTIME VIEW
  return (
    <div className="space-y-6">
      {/* Premium Dynamic Top Bar Banner */}
      <div 
        className="w-full rounded-[32px] px-6 md:px-8 py-10 md:py-14 text-white shadow-xl flex flex-col justify-end relative overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700 shadow-indigo-950/5"
        style={{ backgroundColor: themeColor }}
      >
        {/* Graphic pattern overlays for tech feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-slate-950/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          {courseId !== "preview" && (
            <Link href={`/course/${courseId}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3.5 py-1.5 rounded-xl transition-all mb-6 backdrop-blur-md shadow-sm w-fit active:scale-95 group">
              <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Volver al Curso
            </Link>
          )}
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-2 select-none">Área Académica</p>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight select-none drop-shadow-sm">{courseName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block h-2 w-2 rounded-full bg-white/60 animate-pulse" />
            <p className="text-sm md:text-base font-semibold text-white/80 select-none capitalize">{testTitle.toLowerCase()}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 select-none">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Saturación de Progreso</p>
        <span className="text-xs font-mono font-black bg-white border shadow-sm px-3 py-1.5 rounded-2xl text-slate-600 flex items-center gap-1.5">
          Iteración <strong className="text-slate-950">{currentIndex + 1}</strong> de {questions.length}
        </span>
      </div>

      <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden border border-slate-100/50 relative select-none">
        <div 
          className="h-full transition-all duration-500 ease-out rounded-full shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05)]" 
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: themeColor }} 
        />
      </div>

      {/* SPLIT VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-6 items-start">
        
        {/* LEFT COLUMN: Context & Question Text (Sticky) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="flex justify-between items-center">
            <span 
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border select-none shadow-sm",
                currentQuestion.type === 'AI_OPEN_QUESTION' ? "bg-indigo-100 text-indigo-800 border-indigo-200" : "bg-blue-100 text-blue-800 border-blue-200"
              )}
            >
              {currentQuestion.type === 'AI_OPEN_QUESTION' ? 'Respuesta Abierta (IA)' : 'Selección Múltiple'}
            </span>
          </div>

          <Card className="shadow-xl border-border/40 bg-white overflow-hidden flex flex-col w-full min-h-[200px] rounded-2xl">
            <div className="p-6 md:p-8">
              <div className="prose prose-slate max-w-none prose-p:text-slate-700 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-extrabold">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                  {currentQuestion.question_text || "*(Sin título todavía)*"}
                </ReactMarkdown>
              </div>
              {currentQuestion.image_url && (
                <div className="mt-6 rounded-xl overflow-hidden border bg-black/5 max-h-[320px] flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentQuestion.image_url} 
                    alt="Contexto" 
                    className="object-contain max-h-[320px] w-auto"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Answer Inputs & Bottom Row (Interactive) */}
        <div className="space-y-6">
          <Card className="shadow-xl border-border/40 bg-white w-full rounded-2xl">
            <div className="p-6 md:p-8">
              {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                <div className="grid gap-3.5">
                  {(() => {
                    const isMulti = Array.isArray(currentQuestion.correct_id);
                    const value = userAnswers[currentQuestion.id];
                    const currentSelected = value || (isMulti ? [] : null);
                    
                    const toggleOption = (optId: string) => {
                      if (evaluating) return;
                      if (isMulti) {
                        const currentArr = Array.isArray(currentSelected) ? currentSelected : [];
                        const next = currentArr.includes(optId) 
                          ? currentArr.filter((i: any) => i !== optId)
                          : [...currentArr, optId];
                        setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: next }));
                      } else {
                        setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: optId }));
                      }
                    };

                    const isSelected = (optId: string) => {
                       return isMulti 
                        ? Array.isArray(currentSelected) && currentSelected.includes(optId)
                        : currentSelected === optId;
                    };

                    return currentQuestion.options && currentQuestion.options.length > 0 ? currentQuestion.options.map((opt) => (
                      <button 
                        type="button"
                        key={opt.id}
                        onClick={() => toggleOption(opt.id)}
                        disabled={evaluating}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-medium flex items-start gap-4 group active:scale-[0.99]",
                          isSelected(opt.id)
                            ? "shadow-sm" 
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                        )}
                        style={isSelected(opt.id) ? { borderColor: themeColor, backgroundColor: `${themeColor}0D` } : {}}
                      >
                        <div 
                          className={cn(
                            "w-6 h-6 shrink-0 flex items-center justify-center transition-colors mt-0.5",
                            isMulti ? "rounded-lg border-2" : "rounded-full border-2",
                            isSelected(opt.id) ? "" : "border-slate-300 group-hover:border-slate-400"
                          )}
                          style={isSelected(opt.id) ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                        >
                          {isSelected(opt.id) && (
                            isMulti ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="prose prose-slate prose-sm leading-relaxed flex-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>{opt.text || "Opción sin texto"}</ReactMarkdown>
                        </div>
                      </button>
                    )) : <div className="text-center py-6 text-slate-400 italic">No hay opciones disponibles en esta pregunta.</div>;
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-xl text-sm border border-indigo-100 mb-2 shadow-sm">
                    <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-950 block mb-0.5">Evaluación de Inteligencia Artificial</span>
                      <p className="text-indigo-800 leading-relaxed text-[13px]">
                        El motor evaluará conceptos relativos a: <strong className="text-indigo-900 font-black">{(currentQuestion as any).ai_context?.topic || "Temática General"}</strong>. ¡Sé lo más detallado posible!
                      </p>
                    </div>
                  </div>
                  <Textarea 
                    placeholder="Redacta aquí tu respuesta argumentada..."
                    className="min-h-[220px] text-[15px] resize-none border-2 focus-visible:ring-indigo-500 p-4 rounded-xl shadow-inner bg-slate-50/30 focus-visible:ring-offset-0"
                    value={userAnswers[currentQuestion.id] || ""}
                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    disabled={evaluating}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Navigation Card Container */}
          <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-md">
            <Button 
              variant="ghost" 
              className="font-bold text-slate-500 hover:bg-slate-100 h-11 px-5 rounded-xl transition-all active:scale-95"
              disabled={currentIndex === 0 || evaluating}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Anterior
            </Button>

            {(() => {
              const currentVal = userAnswers[currentQuestion.id];
              const hasValue = Array.isArray(currentVal) ? currentVal.length > 0 : !!currentVal;
              
              if (currentQuestion.type === 'AI_OPEN_QUESTION') {
                return (
                  <Button 
                    disabled={!hasValue || evaluating}
                    onClick={processOpenAnswer}
                    className="font-black h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-600/20 rounded-xl active:scale-95"
                  >
                    {evaluating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Evaluando...</>
                    ) : (
                      <>Enviar Respuesta <ChevronRight className="h-4 w-4 ml-0.5" /></>
                    )}
                  </Button>
                );
              }

              return currentIndex === questions.length - 1 ? (
                <Button 
                  className="font-black h-11 px-8 shadow-lg shadow-indigo-950/10 rounded-xl text-white transition-all active:scale-95 border-0"
                  style={{ backgroundColor: themeColor }}
                  disabled={!hasValue}
                  onClick={() => setShowResults(true)}
                >
                  Finalizar Prueba <Trophy className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  className="font-black h-11 px-8 rounded-xl text-white shadow-md shadow-indigo-950/10 active:scale-95 transition-all border-0"
                  style={{ backgroundColor: themeColor }}
                  disabled={!hasValue}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
