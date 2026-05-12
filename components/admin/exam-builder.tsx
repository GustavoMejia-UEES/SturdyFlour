"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Question } from "@/lib/types/course";
import { PlusCircle, Trash2, Sparkles, AlignLeft, CircleDot, CheckCircle2, Code, Image as ImageIcon, Loader2, PlaySquare, FileJson, Sigma, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { UnifiedSimulator, markdownComponents } from "../simulation/unified-simulator";
import { QuestionVisualCard } from "../simulation/question-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  onChange: (questions: Question[]) => void;
  initialQuestions?: Question[];
  themeColor?: string;
}

export function ExamBuilder({ onChange, initialQuestions = [], themeColor = "#2563eb" }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  
  // Dialog state for new question creation
  const [isOpen, setIsOpen] = useState(false);
  const [uiType, setUiType] = useState<'MCQ' | 'TF' | 'CODE' | 'AI'>('MCQ');
  const [qTitle, setQTitle] = useState("");
  const [qBody, setQBody] = useState("");
  const [qFeedback, setQFeedback] = useState("");
  
  // MCQ/TF State
  const [mcqOptions, setMcqOptions] = useState<{ id: string, text: string }[]>([
    { id: "a", text: "" },
    { id: "b", text: "" },
  ]);
  const [correctIds, setCorrectIds] = useState<string[]>(["a"]);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");
  const [isFormulaGuideOpen, setIsFormulaGuideOpen] = useState(false);

  // AI State
  const [aiTopic, setAiTopic] = useState("");
  const [aiConcepts, setAiConcepts] = useState("");

  // New Feature States
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      const data: any = await resp.json();
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      alert("Error al subir imagen.");
    } finally {
      setIsUploading(false);
    }
  }

  function switchUiType(val: any) {
    // Reset major form values to prevent overlapping states between modes
    setQTitle("");
    setQBody("");
    setQFeedback("");
    setCodeSnippet("");
    setImageUrl("");
    setAiTopic("");
    setAiConcepts("");

    setUiType(val);
    if (val === 'TF') {
      setMcqOptions([{ id: "a", text: "Verdadero" }, { id: "b", text: "Falso" }]);
      setCorrectIds(["a"]);
    } else {
      setMcqOptions([{ id: "a", text: "" }, { id: "b", text: "" }]);
      setCorrectIds(["a"]);
    }
  }

  function insertCodeSnippet() {
    const snippet = "\n```javascript\n// Escribe tu código aquí\n\n```\n";
    setQBody(prev => prev + snippet);
  }

  function insertFormula() {
    const formula = " $$ E = mc^2 $$ ";
    setQBody(prev => prev + formula);
  }

  function insertFormulaToOption(index: number) {
    const next = [...mcqOptions];
    next[index].text = (next[index].text || "") + " $$ x^2 $$ ";
    setMcqOptions(next);
  }

  function handleSaveQuestion() {
    const finalTitle = qTitle.trim() ? `### ${qTitle}\n\n` : "";
    let fullContent = `${finalTitle}${qBody}`;
    
    if (uiType === 'CODE' && codeSnippet) {
      fullContent += `\n\n\`\`\`${codeLang}\n${codeSnippet}\n\`\`\`\n`;
    }

    if (!fullContent.trim()) return;

    let newQuestion: Question;

    if (uiType === 'MCQ' || uiType === 'TF' || uiType === 'CODE') {
      if (correctIds.length === 0) {
        alert("Debes seleccionar al menos una respuesta correcta.");
        return;
      }
      newQuestion = {
        id: crypto.randomUUID(),
        type: 'MULTIPLE_CHOICE',
        question_text: fullContent,
        image_url: imageUrl || undefined,
        options: mcqOptions.filter(o => o.text.trim()),
        correct_id: correctIds.length === 1 ? correctIds[0] : correctIds, 
        feedback_general: qFeedback.trim() || undefined
      };
    } else {
      newQuestion = {
        id: crypto.randomUUID(),
        type: 'AI_OPEN_QUESTION',
        question_text: fullContent,
        image_url: imageUrl || undefined,
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
    
    // Reset
    setIsOpen(false);
    setQTitle("");
    setQBody("");
    setQFeedback("");
    setCodeSnippet("");
    setAiTopic("");
    setAiConcepts("");
    setCorrectIds(["a"]);
    setMcqOptions([{ id: "a", text: "" }, { id: "b", text: "" }]);
    setImageUrl("");
    setUiType('MCQ');
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
        <div className="flex items-center gap-2 justify-between mb-5">
          <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <AlignLeft className="h-4 w-4" /> Banco de Preguntas ({questions.length})
          </h3>
          <div className="flex items-center gap-2">
            {questions.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 h-8">
                    <PlaySquare className="h-3.5 w-3.5" /> Previsualizar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto bg-slate-50 flex flex-col p-0">
                  <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-indigo-900 flex items-center gap-2 font-black">
                      <Sparkles className="h-5 w-5" /> Simulación de Prueba (Modo Preview)
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
                     <UnifiedSimulator 
                       questions={questions} 
                       courseName="Vista Previa Editor" 
                       testTitle="Examen en Construcción" 
                       courseId="preview"
                     />
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {questions.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500 hover:text-indigo-600 h-8">
                    <FileJson className="h-3.5 w-3.5" /> JSON Raw
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black">
                      <FileJson className="h-5 w-5 text-indigo-600" /> Exportar JSON a Portapapeles
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Copia este bloque y pégalo en tu chat de IA favorito para que genere mejoras, correcciones de código o feedback más completo instantáneamente.
                    </p>
                    <div className="relative group">
                      <pre className="bg-slate-950 text-green-400 font-mono text-[10px] p-4 rounded-xl max-h-[300px] overflow-y-auto border shadow-inner selection:bg-indigo-500/30">
                        {JSON.stringify(questions, null, 2)}
                      </pre>
                      <Button 
                        size="sm" 
                        className="absolute top-2 right-2 opacity-90 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
                          alert("¡Copiado al portapapeles! Listo para pegar en tu LLM.");
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button size="sm" onClick={() => setIsOpen(true)} className="gap-1 shadow-sm h-8 font-bold" style={{ backgroundColor: themeColor }}>
              <PlusCircle className="h-3.5 w-3.5" /> Añadir Pregunta
            </Button>
          </div>
        </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white flex flex-col border-none shadow-2xl rounded-3xl">
            {/* Derive temporary preview object dynamically */}
            {(() => {
              const finalTitle = qTitle.trim() ? `### ${qTitle}\n\n` : "";
              let tempContent = `${finalTitle}${qBody}`;
              if (uiType === 'CODE' && codeSnippet) {
                tempContent += `\n\n\`\`\`${codeLang}\n${codeSnippet}\n\`\`\`\n`;
              }
              
              const mockQuestion: Question = (uiType === 'AI') 
                ? {
                    id: 'preview',
                    type: 'AI_OPEN_QUESTION',
                    question_text: tempContent || "Escribe tu pregunta a la izquierda...",
                    image_url: imageUrl || undefined,
                    ai_context: { topic: aiTopic, expected_concepts: [], difficulty: 'beginner' }
                  }
                : {
                    id: 'preview',
                    type: 'MULTIPLE_CHOICE',
                    question_text: tempContent || "Escribe tu pregunta a la izquierda...",
                    image_url: imageUrl || undefined,
                    options: mcqOptions.filter(o => o.text),
                    correct_id: correctIds,
                    feedback_general: qFeedback
                  };

              return (
                <div className="flex h-full w-full">
                  {/* LEFT SIDE: EDITOR STUDIO */}
                  <div className="w-[45%] h-full overflow-y-auto bg-slate-50/50 border-r flex flex-col">
                    <div className="px-6 py-5 border-b bg-white sticky top-0 z-10 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Editor de Pregunta</h3>
                      <Button onClick={handleSaveQuestion} className="font-bold gap-2 bg-green-600 hover:bg-green-700 shadow-sm">Guardar Cambios</Button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Question Types Tabs */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Estructura</Label>
                        <Tabs value={uiType} onValueChange={switchUiType} className="w-full">
                          <TabsList className="grid grid-cols-4 h-11 bg-slate-100">
                            <TabsTrigger value="MCQ" className="text-xs font-bold">Opción</TabsTrigger>
                            <TabsTrigger value="TF" className="text-xs font-bold">V/F</TabsTrigger>
                            <TabsTrigger value="CODE" className="text-xs font-bold">Código</TabsTrigger>
                            <TabsTrigger value="AI" className="text-xs font-bold">Abierta</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Core Fields */}
                      <div className="space-y-4">
                        <div className="grid gap-1.5">
                          <Label className="text-slate-700 font-semibold">Título (Opcional)</Label>
                          <Input placeholder="Ej: Análisis de Algoritmos" value={qTitle} onChange={e => setQTitle(e.target.value)} className="bg-white border-slate-200" />
                        </div>

                        <div className="grid gap-1.5">
                          <div className="flex justify-between items-center gap-2">
                            <Label className="text-slate-700 font-semibold">Contenido / Contexto</Label>
                            <div className="flex gap-1 items-center">
                              <button type="button" className="p-1 text-slate-400 hover:text-blue-600 transition-colors mr-1" onClick={() => setIsFormulaGuideOpen(true)} title="Ver Guía de Fórmulas">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-primary" onClick={insertFormula}>
                                <Sigma className="h-3 w-3 mr-1" /> Fórmula
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-primary" onClick={insertCodeSnippet}>
                                <Code className="h-3 w-3 mr-1" /> Inyectar Código
                              </Button>
                            </div>
                          </div>
                          <Textarea 
                            placeholder="Describe la situación o problema aquí. Soporta Markdown..." 
                            className="min-h-[120px] font-mono text-sm bg-white border-slate-200 focus:ring-2"
                            value={qBody} onChange={e => setQBody(e.target.value)}
                          />
                        </div>

                        {/* Code Sandbox specific fields */}
                        {uiType === 'CODE' && (
                          <div className="bg-[#1E1E1E] text-slate-300 rounded-xl border border-slate-800 overflow-hidden">
                            <div className="px-4 py-2 bg-[#191919] border-b border-slate-800 flex justify-between items-center">
                              <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Code Sandbox Frame
                              </span>
                              <Select value={codeLang} onValueChange={setCodeLang}>
                                <SelectTrigger className="h-6 w-24 text-[10px] bg-transparent border-slate-700 text-slate-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="javascript">JS</SelectItem>
                                  <SelectItem value="typescript">TS</SelectItem>
                                  <SelectItem value="python">Python</SelectItem>
                                  <SelectItem value="css">CSS</SelectItem>
                                  <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Textarea 
                              value={codeSnippet}
                              onChange={e => setCodeSnippet(e.target.value)}
                              placeholder="// Pega aquí el código que se renderizará como IDE..."
                              className="min-h-[150px] border-0 bg-transparent font-mono text-[13px] text-white focus-visible:ring-0 rounded-none placeholder:text-slate-600"
                            />
                          </div>
                        )}

                        {/* Image Slot */}
                        <div className="p-3 rounded-xl border bg-slate-50 border-dashed border-slate-300">
                          <Label className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600"><ImageIcon className="h-3.5 w-3.5" /> Adjuntar Multimedia</Label>
                          <div className="flex gap-3 items-center">
                            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="text-xs bg-white h-9" />
                            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {imageUrl && <img src={imageUrl} alt="thumb" className="h-9 w-9 object-cover rounded border bg-white" />}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200 my-4"></div>

                      {/* Configuration specifics based on Type */}
                      {(uiType === 'MCQ' || uiType === 'TF' || uiType === 'CODE') ? (
                        <div className="space-y-4">
                          <Label className="text-slate-700 font-bold block">Opciones de Respuesta</Label>
                          <div className="grid gap-2">
                            {mcqOptions.map((opt, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                <button 
                                  type="button"
                                  onClick={() => toggleCorrectId(opt.id)}
                                  className={cn(
                                    "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border-2 transition-all",
                                    correctIds.includes(opt.id) ? "bg-green-600 border-green-600 text-white" : "bg-white border-slate-200 hover:border-slate-300 text-slate-400"
                                  )}
                                >
                                  {correctIds.includes(opt.id) ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
                                </button>
                                <div className="flex-1 relative group/item">
                                  <Input 
                                    placeholder={`Texto de opción ${i+1}`}
                                    value={opt.text}
                                    disabled={uiType === 'TF'}
                                    onChange={(e) => {
                                      const next = [...mcqOptions];
                                      next[i].text = e.target.value;
                                      setMcqOptions(next);
                                    }}
                                    className="bg-white h-10 pr-10"
                                  />
                                  {uiType !== 'TF' && (
                                    <button 
                                      type="button"
                                      onClick={() => insertFormulaToOption(i)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1 opacity-50 group-hover/item:opacity-100"
                                      title="Insertar Fórmula LaTeX"
                                    >
                                      <Sigma className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                                {uiType !== 'TF' && mcqOptions.length > 2 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 shrink-0" onClick={() => setMcqOptions(mcqOptions.filter(o => o.id !== opt.id))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {uiType !== 'TF' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-dashed border-2 mt-1 h-9 font-medium text-slate-600"
                                onClick={() => setMcqOptions([...mcqOptions, { id: crypto.randomUUID().substring(0,4), text: "" }])}
                              >
                                + Añadir Nueva Alternativa
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                          <Label className="text-indigo-900 font-bold block">Criterios de IA</Label>
                          <div className="space-y-3">
                            <div className="grid gap-1">
                              <Label className="text-xs text-indigo-700">Materia o Tópico</Label>
                              <Input placeholder="Contexto general" value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="bg-white h-9 border-indigo-200" />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs text-indigo-700">Palabras Clave / Conceptos (Separado por comas)</Label>
                              <Textarea placeholder="Shadowing, hoisting, scopes..." value={aiConcepts} onChange={e => setAiConcepts(e.target.value)} className="bg-white text-sm border-indigo-200 min-h-[60px]" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Feedback field for non-AI questions */}
                      {uiType !== 'AI' && (
                        <div className="mt-6 border-t pt-4">
                          <Label className="text-slate-700 font-bold flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-amber-500"/> Feedback / Explicación Final (Opcional)</Label>
                          <Textarea 
                            placeholder="Esta explicación se le mostrará al alumno si falla o después de responder..." 
                            className="min-h-[80px] bg-amber-50/20 border-amber-100 text-sm"
                            value={qFeedback}
                            onChange={e => setQFeedback(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: REAL-TIME PREVIEW */}
                  <div className="flex-1 bg-[#F8FAFC] flex flex-col h-full relative overflow-y-auto">
                    <div className="sticky top-0 bg-white/80 backdrop-blur py-3 px-6 z-10 border-b text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                      Espejo de Visualización en Vivo (Simulador Real)
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center p-12">
                      {/* Render the shared visual card exactly how users see it */}
                      <div className="w-full transform scale-105 transition-all duration-300">
                        <QuestionVisualCard question={mockQuestion} disabled={true} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* HELP DIALOG: FORMULA GUIDE */}
        <Dialog open={isFormulaGuideOpen} onOpenChange={setIsFormulaGuideOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sigma className="h-5 w-5 text-blue-600" /> Guía de Fórmulas LaTeX
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-slate-700">
              <p>Puedes insertar ecuaciones tipográficas profesionales usando delimitadores de dólar:</p>
              
              <div className="p-3 rounded-lg bg-slate-50 border space-y-2">
                <div className="font-bold text-xs uppercase text-slate-400">Fórmula en Línea (dentro del texto)</div>
                <code className="text-pink-600 block font-mono bg-white p-2 rounded border">$ E = mc^2 $</code>
                <p className="text-xs text-slate-500">Usa un solo signo de dólar al inicio y al final.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border space-y-2">
                <div className="font-bold text-xs uppercase text-slate-400">Fórmula en Bloque (línea separada)</div>
                <code className="text-pink-600 block font-mono bg-white p-2 rounded border">{"$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$"}</code>
                <p className="text-xs text-slate-500">Usa doble signo de dólar para que ocupe todo el ancho y se centre.</p>
              </div>

              <div className="mt-2 pt-2 border-t">
                <p className="font-bold mb-1 text-xs text-slate-500">Símbolos Comunes:</p>
                <ul className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <li>Fracción: <span className="text-pink-600">{"\\frac{a}{b}"}</span></li>
                  <li>Raíz: <span className="text-pink-600">{"\\sqrt{x}"}</span></li>
                  <li>Potencia: <span className="text-pink-600">{"x^2"}</span></li>
                  <li>Subíndice: <span className="text-pink-600">{"x_i"}</span></li>
                  <li>Suma: <span className="text-pink-600">{"\\sum"}</span></li>
                  <li>Integral: <span className="text-pink-600">{"\\int"}</span></li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
            <Button size="lg" onClick={() => setIsOpen(true)} className="font-bold gap-2 shadow-lg animate-bounce-once" style={{ backgroundColor: themeColor }}>
              <PlusCircle className="h-5 w-5" /> ¡Empezar a Crear Preguntas!
            </Button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <QuestionBankItem key={q.id} q={q} idx={idx} onRemove={() => removeQuestion(q.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function QuestionBankItem({ q, idx, onRemove }: { q: Question, idx: number, onRemove: () => void }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="shadow-sm hover:border-primary/50 transition-colors relative overflow-hidden group">
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 flex gap-3">
          <div className="h-7 w-7 bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border tracking-wide ${
                q.type === 'AI_OPEN_QUESTION' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {q.type === 'AI_OPEN_QUESTION' ? 'Respuesta Abierta' : 'Multi-Opción'}
              </span>
              <button 
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] font-bold text-blue-600 hover:underline uppercase ml-auto"
              >
                {expanded ? 'Contraer [-]' : 'Expandir [+]'}
              </button>
            </div>

            <div className={cn(
              "relative font-medium text-sm leading-snug text-slate-800 prose prose-slate prose-sm prose-p:leading-tight max-w-full",
              !expanded && "max-h-[80px] overflow-hidden"
            )}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                {q.question_text}
              </ReactMarkdown>
              {!expanded && (
                <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
