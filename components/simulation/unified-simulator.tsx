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

type AIResult = {
  score: number;
  analysis: string;
  found_concepts: string[];
}

export function UnifiedSimulator({ testTitle, courseName, questions, courseId }: { 
  testTitle: string;
  testType?: string;
  courseName: string;
  questions: Question[];
  assessmentId?: string;
  courseId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // State for async AI evaluations results
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, AIResult>>({});
  const [evaluating, setEvaluating] = useState(false);

  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Scoring Logic
  const calculateFinalScore = () => {
    let earnedPoints = 0;
    questions.forEach(q => {
      if (q.type === 'MULTIPLE_CHOICE') {
        if (userAnswers[q.id] === q.correct_id) earnedPoints += 100;
      } else if (q.type === 'AI_OPEN_QUESTION') {
        // Add weight of AI Score
        earnedPoints += (aiEvaluations[q.id]?.score || 0);
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
        currentQuestion.ai_context.topic,
        currentQuestion.ai_context.expected_concepts,
        currentQuestion.ai_context.difficulty
      );
      
      setAiEvaluations(prev => ({ ...prev, [currentQuestion.id]: result as AIResult }));
      
      // Auto-advance if valid
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    } catch (error) {
      console.error(error);
      alert("Error evaluando con IA. Inténtalo de nuevo.");
    } finally {
      setEvaluating(false);
    }
  }

  // RENDER RESULT VIEW
  if (showResults) {
    const finalScore = calculateFinalScore();
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Card className="border-t-4 border-t-primary overflow-hidden bg-white shadow-md text-center">
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
              return (
                <Card key={q.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h4 className="font-bold leading-tight">{idx+1}. {q.question_text}</h4>
                      <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded shadow-sm">IA SCORING: {evalRes?.score ?? 0}%</span>
                    </div>
                    <div className="text-sm bg-slate-50 p-3 rounded border mb-3 italic text-slate-700">
                      &quot;{userAnswers[q.id]}&quot;
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-indigo-900 font-medium">{evalRes?.analysis || "No se pudo generar feedback."}</p>
                        {evalRes?.found_concepts && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {evalRes.found_concepts.map(c => (
                              <span key={c} className="text-[10px] uppercase font-bold bg-white text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200">CONCEPT: {c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            // MCQ Logic remains same but adapted to Schema labels
            const isCorrect = userAnswers[q.id] === q.correct_id;
            return (
              <Card key={q.id} className={cn("border-l-4", isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                 <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold leading-tight">{idx+1}. {q.question_text}</h4>
                      {isCorrect ? <CheckCircle2 className="text-green-600 h-5 w-5" /> : <XCircle className="text-red-600 h-5 w-5" />}
                    </div>
                    {q.feedback_general && !isCorrect && (
                      <p className="text-xs text-slate-500 bg-slate-50 border p-2 rounded mt-2">💡 Tip: {q.feedback_general}</p>
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
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">{courseName}</p>
          <h1 className="text-2xl font-black text-slate-900 leading-none">{testTitle}</h1>
        </div>
        <span className="text-sm font-mono font-bold bg-white border shadow-sm px-3 py-1 rounded-full text-slate-600">
          Iteración {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <Card className="shadow-xl border-border/60 bg-white min-h-[300px] flex flex-col">
        <CardHeader className="pb-6 border-b bg-slate-50/50">
          <div className="flex gap-2 mb-2">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
              currentQuestion.type === 'AI_OPEN_QUESTION' ? "bg-indigo-100 text-indigo-800 border-indigo-200" : "bg-blue-100 text-blue-800 border-blue-200"
            )}>
              {currentQuestion.type === 'AI_OPEN_QUESTION' ? 'Respuesta Abierta (IA)' : 'Selección Múltiple'}
            </span>
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold leading-tight text-slate-800">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 py-8 px-6 md:px-10">
          {/* Conditional Rendering per type */}
          {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
            <div className="grid gap-3">
              {currentQuestion.options.map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.id }))}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium text-lg flex items-center gap-4 group",
                    userAnswers[currentQuestion.id] === opt.id 
                      ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                    userAnswers[currentQuestion.id] === opt.id ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-slate-400"
                  )}>
                    {userAnswers[currentQuestion.id] === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  {opt.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-lg text-sm border border-indigo-100 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-indigo-900 block mb-1">Contexto para la IA</span>
                  <p className="text-indigo-800/80 leading-relaxed">
                    Explica tu punto con claridad. La IA validará conceptos relacionados con: <strong className="text-indigo-900">{currentQuestion.ai_context.topic}</strong>.
                  </p>
                </div>
              </div>
              <Textarea 
                placeholder="Escribe aquí tu explicación detallada..."
                className="min-h-[200px] text-base resize-none border-2 focus-visible:ring-indigo-500"
                value={userAnswers[currentQuestion.id] || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                disabled={evaluating}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 py-5 border-t flex justify-between">
          <Button 
            variant="ghost" 
            className="font-bold"
            disabled={currentIndex === 0 || evaluating}
            onClick={() => setCurrentIndex(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          {currentQuestion.type === 'AI_OPEN_QUESTION' ? (
            <Button 
              disabled={!userAnswers[currentQuestion.id] || evaluating}
              onClick={processOpenAnswer}
              className="font-black px-8 bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-md shadow-indigo-200"
            >
              {evaluating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Evaluando con IA...</>
              ) : (
                <>Enviar y Avanzar <ChevronRight className="h-4 w-4" /></>
              )}
            </Button>
          ) : (
            currentIndex === questions.length - 1 ? (
              <Button 
                className="font-black px-8 shadow-lg"
                disabled={!userAnswers[currentQuestion.id]}
                onClick={() => setShowResults(true)}
              >
                Finalizar Prueba <Trophy className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="font-black px-8"
                disabled={!userAnswers[currentQuestion.id]}
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
