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

export function UnifiedSimulator({ testTitle, courseName, questions, courseId }: { 
  testTitle: string;
  testType?: string;
  courseName: string;
  questions: Question[];
  assessmentId?: string;
  courseId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  
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
        const correctAnswers = Array.isArray(q.correct_id) ? [...q.correct_id].sort() : [q.correct_id];
        const userResp = userAnswers[q.id];
        const userArr = Array.isArray(userResp) ? [...userResp].sort() : [userResp];
        
        const isMatch = JSON.stringify(correctAnswers) === JSON.stringify(userArr);
        if (isMatch) earnedPoints += 100;
      } else if (q.type === 'AI_OPEN_QUESTION') {
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
                      <h4 className="font-bold leading-tight prose prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{`${idx+1}. ${q.question_text}`}</ReactMarkdown></h4>
                      <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded shadow-sm">IA SCORING: {evalRes?.score ?? 0}%</span>
                    </div>
                    <div className="text-sm bg-slate-50 p-3 rounded border mb-3 italic text-slate-700 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{`"${userAnswers[q.id]}"`}</ReactMarkdown>
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
            const isMultipleCorrect = Array.isArray(q.correct_id);
            const correctSorted = isMultipleCorrect ? [...q.correct_id].sort() : [q.correct_id];
            const currentAns = userAnswers[q.id];
            const ansSorted = Array.isArray(currentAns) ? [...currentAns].sort() : [currentAns];
            const isCorrect = JSON.stringify(correctSorted) === JSON.stringify(ansSorted);

            return (
              <Card key={q.id} className={cn("border-l-4", isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                 <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold leading-tight prose prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{`${idx+1}. ${q.question_text}`}</ReactMarkdown></h4>
                      {isCorrect ? <CheckCircle2 className="text-green-600 h-5 w-5 shrink-0" /> : <XCircle className="text-red-600 h-5 w-5 shrink-0" />}
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

      <QuestionVisualCard 
        question={currentQuestion}
        value={userAnswers[currentQuestion.id]}
        onChange={(val) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
        disabled={evaluating}
      />

      <div className="mt-5 flex justify-between items-center bg-white/50 backdrop-blur-sm border border-slate-200/60 p-4 rounded-2xl shadow-sm">
        <Button 
          variant="ghost" 
          className="font-bold text-slate-500"
          disabled={currentIndex === 0 || evaluating}
          onClick={() => setCurrentIndex(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>

        {(() => {
          const currentVal = userAnswers[currentQuestion.id];
          const hasValue = Array.isArray(currentVal) ? currentVal.length > 0 : !!currentVal;
          
          if (currentQuestion.type === 'AI_OPEN_QUESTION') {
            return (
              <Button 
                disabled={!hasValue || evaluating}
                onClick={processOpenAnswer}
                className="font-bold px-8 bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-200/50 rounded-xl"
              >
                {evaluating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Evaluando...</>
                ) : (
                  <>Enviar Respuesta <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            );
          }

          return currentIndex === questions.length - 1 ? (
            <Button 
              className="font-bold px-8 shadow-lg shadow-primary/20 rounded-xl"
              disabled={!hasValue}
              onClick={() => setShowResults(true)}
            >
              Finalizar Prueba <Trophy className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              className="font-bold px-8 rounded-xl shadow-md"
              disabled={!hasValue}
              onClick={() => setCurrentIndex(prev => prev + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          );
        })()}
      </div>
    </div>
  );
}
