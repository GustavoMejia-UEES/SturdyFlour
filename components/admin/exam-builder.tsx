"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Question } from "@/lib/types/course";
import { PlusCircle, Trash2, Sparkles, AlignLeft, CircleDot, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  onChange: (questions: Question[]) => void;
  initialQuestions?: Question[];
}

export function ExamBuilder({ onChange, initialQuestions = [] }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  
  // Dialog state for new question creation
  const [isOpen, setIsOpen] = useState(false);
  const [qType, setQType] = useState<'MULTIPLE_CHOICE' | 'AI_OPEN_QUESTION'>('MULTIPLE_CHOICE');
  const [qText, setQText] = useState("");
  
  // MCQ State
  const [mcqOptions, setMcqOptions] = useState<{ id: string, text: string }[]>([
    { id: "a", text: "" },
    { id: "b", text: "" },
  ]);
  const [correctIds, setCorrectIds] = useState<string[]>(["a"]);

  // AI State
  const [aiTopic, setAiTopic] = useState("");
  const [aiConcepts, setAiConcepts] = useState("");

  function handleSaveQuestion() {
    if (!qText.trim()) return;

    let newQuestion: Question;

    if (qType === 'MULTIPLE_CHOICE') {
      if (correctIds.length === 0) {
        alert("Debes seleccionar al menos una respuesta correcta.");
        return;
      }
      newQuestion = {
        id: crypto.randomUUID(),
        type: 'MULTIPLE_CHOICE',
        question_text: qText,
        options: mcqOptions.filter(o => o.text.trim()),
        correct_id: correctIds.length === 1 ? correctIds[0] : correctIds, // Supports both string & string[]
      };
    } else {
      newQuestion = {
        id: crypto.randomUUID(),
        type: 'AI_OPEN_QUESTION',
        question_text: qText,
        ai_context: {
          topic: aiTopic || "General",
          expected_concepts: aiConcepts.split(",").map(c => c.trim()).filter(c => c),
          difficulty: 'beginner'
        }
      };
    }

    const updated = [...questions, newQuestion];
    setQuestions(updated);
    onChange(updated);
    
    // Reset Modal state
    setIsOpen(false);
    setQText("");
    setAiTopic("");
    setAiConcepts("");
    setCorrectIds(["a"]);
    setMcqOptions([{ id: "a", text: "" }, { id: "b", text: "" }]);
  }

  function toggleCorrectId(id: string) {
    setCorrectIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  }

  function removeQuestion(id: string) {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <AlignLeft className="h-5 w-5 text-primary" /> Banco de Preguntas ({questions.length})
        </h3>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-bold gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" /> Añadir Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-white">
            <DialogHeader>
              <DialogTitle>Configurar Nueva Pregunta</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label>Tipo de Pregunta</Label>
                <Select 
                  value={qType} 
                  onValueChange={(v: 'MULTIPLE_CHOICE' | 'AI_OPEN_QUESTION') => setQType(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Opción Múltiple (Autocorregible)</SelectItem>
                    <SelectItem value="AI_OPEN_QUESTION">Respuesta Abierta (Calificado por IA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Enunciado / Texto de la Pregunta</Label>
                <Textarea 
                  placeholder="Ej: ¿Cómo se define una variable global?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {qType === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                  <Label className="text-slate-700">Opciones de Respuesta</Label>
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Button 
                        variant={correctIds.includes(opt.id) ? "default" : "outline"} 
                        size="icon"
                        className={`shrink-0 transition-all ${correctIds.includes(opt.id) ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                        onClick={() => toggleCorrectId(opt.id)}
                        type="button"
                      >
                        {correctIds.includes(opt.id) ? <CheckCircle2 className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                      </Button>
                      <Input 
                        placeholder={`Opción ${opt.id.toUpperCase()}`} 
                        value={opt.text}
                        onChange={(e) => {
                          const next = [...mcqOptions];
                          next[i].text = e.target.value;
                          setMcqOptions(next);
                        }}
                      />
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => setMcqOptions([...mcqOptions, { id: String.fromCharCode(97 + mcqOptions.length), text: "" }])}
                  >
                    + Añadir otra opción
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm mb-1">
                    <Sparkles className="h-4 w-4" /> Ajustes del Calificador IA
                  </div>
                  <div className="grid gap-2">
                    <Label>Tema Principal (Contexto)</Label>
                    <Input 
                      placeholder="Ej: Scope de Variables" 
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Conceptos Esperados (Separados por coma)</Label>
                    <Input 
                      placeholder="memoria, ámbito global, shadowing" 
                      value={aiConcepts}
                      onChange={(e) => setAiConcepts(e.target.value)}
                    />
                    <p className="text-[10px] text-indigo-700 italic">La IA buscará estas palabras o sinónimos semánticos en la respuesta.</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleSaveQuestion} className="font-bold w-full sm:w-auto">Guardar Pregunta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed rounded-xl bg-slate-50/50 flex flex-col items-center">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
              <PlusCircle className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">No hay preguntas todavía</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Añade tu primera pregunta interactiva para habilitar el examen.
            </p>
            <Button size="lg" onClick={() => setIsOpen(true)} className="font-bold gap-2 shadow-lg shadow-primary/20 animate-bounce-once">
              <PlusCircle className="h-5 w-5" /> ¡Empezar a Crear Preguntas!
            </Button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id} className="shadow-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        q.type === 'AI_OPEN_QUESTION' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {q.type === 'AI_OPEN_QUESTION' ? 'IA Open' : 'MCQ'}
                      </span>
                    </div>
                    <div className="font-medium text-sm leading-snug text-slate-800 prose prose-slate prose-sm prose-p:leading-tight">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question_text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
