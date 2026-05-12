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
import { PlusCircle, Trash2, Sparkles, AlignLeft, CircleDot, CheckCircle2, Code, Image as ImageIcon, Loader2, PlaySquare, FileJson, Sigma, HelpCircle, Eye, Pencil, Info, Copy, AlertTriangle, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { UnifiedSimulator, markdownComponents } from "../simulation/unified-simulator";
import { QuestionVisualCard } from "../simulation/question-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_JSON_TEMPLATES: Question[] = [
  {
    id: "e3b4a291-182c-4739-b9d1-817bf5da01e2",
    type: "MULTIPLE_CHOICE",
    question_text: "### Cálculo de Derivadas\n\n¿Cuál es la derivada de la función de costo respecto al peso utilizando la regla de la cadena?\n\n$$ \\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial w} $$",
    options: [
      {
        id: "a",
        text: "Es el producto de las derivadas parciales intermedias."
      },
      {
        id: "b",
        text: "Se calcula sumando las pendientes locales."
      }
    ],
    correct_id: ["a"],
    feedback_general: "La regla de la cadena establece que multiplicamos las tasas de cambio locales para obtener la tasa de cambio global."
  },
  {
    id: "fa92c340-912b-42ea-a410-b99182fa3c11",
    type: "MULTIPLE_CHOICE",
    question_text: "### Evaluación de Condicionales\n\n¿El siguiente bloque de código evalúa a `true` si el arreglo está vacío?\n\n```javascript\nconst items = [];\nif (items.length === 0) {\n  console.log('Vacío');\n}\n```",
    options: [
      {
        id: "a",
        text: "Verdadero"
      },
      {
        id: "b",
        text: "Falso"
      }
    ],
    correct_id: "a",
    feedback_general: "La propiedad `.length` de un arreglo vacío es estrictamente igual a 0."
  },
  {
    id: "8b23c914-cd12-4fb3-a9d5-7cfaef0218ef",
    type: "MULTIPLE_CHOICE",
    question_text: "### Tipado en TypeScript\n\nAnaliza el siguiente fragmento de código sobre interfaces:\n\n```typescript\ninterface User {\n  id: string;\n  role: 'admin' | 'user';\n}\n```",
    options: [
      {
        id: "a",
        text: "El rol solo acepta los literales 'admin' o 'user'."
      },
      {
        id: "b",
        text: "El rol acepta cualquier cadena de texto (string)."
      }
    ],
    correct_id: "a",
    feedback_general: "Estamos utilizando un tipo unión de literales string para restringir los valores posibles."
  },
  {
    id: "bc38e912-74ba-45fa-8dfa-1293aabf9d04",
    type: "AI_OPEN_QUESTION",
    question_text: "### Optimización de Consultas SQL\n\nExplica con tus propias palabras la diferencia de rendimiento entre un `Table Scan` y un `Index Scan` en una base de datos relacional masiva.",
    ai_context: {
      topic: "Bases de Datos",
      expected_concepts: [
        "complejidad temporal",
        "índices b-tree",
        "lectura de páginas secuencial"
      ],
      difficulty: "intermediate"
    }
  }
];

interface Props {
  onChange: (questions: Question[]) => void;
  initialQuestions?: Question[];
  themeColor?: string;
}

export function ExamBuilder({ onChange, initialQuestions = [], themeColor = "#2563eb" }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  
  // Dialog state for new question creation
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // ADVANCED RAW JSON EDITOR STATES
  const [isRawJsonOpen, setIsRawJsonOpen] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonViewMode, setJsonViewMode] = useState<'current' | 'template'>('current');

  // LIGHTWEIGHT TOAST NOTIFIER
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleStartEdit(q: Question) {
    setEditingId(q.id);
    
    let text = q.question_text || "";
    let extractedTitle = "";
    
    // 1. Extract Markdown Header Title if present
    if (text.startsWith("### ")) {
      const lines = text.split("\n");
      extractedTitle = lines[0].replace("### ", "").trim();
      text = lines.slice(1).join("\n").trim();
    }
    
    // 2. Extract Code Block if present (Regex match ```)
    let extractedSnippet = "";
    let extractedLang = "javascript";
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match) {
      extractedLang = match[1] || "javascript";
      extractedSnippet = match[2] || "";
      text = text.replace(codeBlockRegex, "").trim();
    }
    
    // Populate Common Fields
    setQTitle(extractedTitle);
    setQBody(text);
    setQFeedback(q.feedback_general || "");
    setImageUrl(q.image_url || "");
    
    // Determine & Populate Type Specifics
    if (q.type === 'AI_OPEN_QUESTION') {
      setUiType('AI');
      setAiTopic(q.ai_context?.topic || "");
      setAiConcepts(q.ai_context?.expected_concepts?.join(", ") || "");
    } else {
      // MULTIPLE CHOICE TYPES (Standard, Code Sandbox, or True/False)
      const opts = q.options || [];
      setMcqOptions(opts.length ? opts : [{ id: "a", text: "" }, { id: "b", text: "" }]);
      
      // Normalize correct ID into array
      if (Array.isArray(q.correct_id)) {
        setCorrectIds(q.correct_id);
      } else {
        setCorrectIds(q.correct_id ? [q.correct_id] : ["a"]);
      }
      
      if (extractedSnippet) {
        setUiType('CODE');
        setCodeSnippet(extractedSnippet);
        setCodeLang(extractedLang);
      } else if (
        opts.length === 2 && 
        opts.some(o => o.text.toLowerCase() === 'verdadero') && 
        opts.some(o => o.text.toLowerCase() === 'falso')
      ) {
        setUiType('TF');
      } else {
        setUiType('MCQ');
      }
    }
    
    setIsOpen(true);
  }

  function openRawJson() {
    const isDeckEmpty = questions.length === 0;
    setJsonViewMode(isDeckEmpty ? 'template' : 'current');
    
    // Prepopulate editor with standard guide if they don't have custom data yet
    const targetDataset = isDeckEmpty ? DEFAULT_JSON_TEMPLATES : questions;
    setRawJsonInput(JSON.stringify(targetDataset, null, 2));
    setJsonError(null);
    setIsRawJsonOpen(true);
  }

  function handleApplyRawJson() {
    try {
      const parsed = JSON.parse(rawJsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Estructura inválida: El JSON raíz debe ser un Array [] de preguntas.");
      }
      
      const seenIds = new Set<string>();
      
      // Validation & Autonomous Identity Healing (Fixes user question IDs)
      const healed = parsed.map((q: any, idx: number) => {
        if (!q.question_text) {
          throw new Error(`Error en pregunta #${idx + 1}: Falta el campo obligatorio 'question_text'.`);
        }
        if (!q.type) {
          throw new Error(`Error en pregunta #${idx + 1}: Falta el campo 'type' (ej: MULTIPLE_CHOICE o AI_OPEN_QUESTION).`);
        }

        // HEALING ENGINE FOR ID MANAGEMENT
        // Detect if ID is missing, duplicate, trivially numeric (like "1", "2" from AI generators), or too short
        const isMissing = !q.id;
        const isTrivial = q.id && (String(q.id).trim().length < 5 || !isNaN(Number(q.id)));
        const isDuplicate = q.id && seenIds.has(String(q.id));
        
        let finalId = q.id;
        if (isMissing || isTrivial || isDuplicate) {
          finalId = crypto.randomUUID(); // Standard robust UUID replacement
        }
        
        seenIds.add(String(finalId));

        return {
          ...q,
          id: finalId,
          options: q.options || [],
          correct_id: q.correct_id ?? (q.options && q.options[0] ? q.options[0].id : "a")
        } as Question;
      });

      setQuestions(healed);
      onChange(healed);
      setIsRawJsonOpen(false);
      showToast("Banco de preguntas sincronizado y validado exitosamente");
    } catch (err: any) {
      setJsonError(err.message || "Error al procesar la cadena JSON. Asegúrese que el formato sea correcto.");
    }
  }

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
      showToast("Error al subir imagen", "error");
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

  function handleOpenNewQuestion() {
    setEditingId(null);
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
    setIsOpen(true);
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
        showToast("Debes seleccionar al menos una respuesta correcta", "error");
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

    const updated = editingId 
      ? questions.map(q => q.id === editingId ? { ...newQuestion, id: editingId } : q)
      : [...questions, newQuestion];
    
    setQuestions(updated);
    onChange(updated);
    
    // Reset form states completely
    setIsOpen(false);
    setEditingId(null);
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

            <Button variant="ghost" size="sm" onClick={openRawJson} className="gap-1 text-xs text-slate-500 hover:text-indigo-600 h-8">
              <FileJson className="h-3.5 w-3.5" /> JSON Raw
            </Button>
            <Dialog open={isRawJsonOpen} onOpenChange={setIsRawJsonOpen}>
              <DialogContent className="max-w-3xl bg-white rounded-3xl shadow-2xl border-none flex flex-col max-h-[90vh] overflow-hidden p-0">
                <div className="px-6 py-5 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                  <DialogTitle className="flex items-center gap-2 font-black text-indigo-900 text-xl">
                    <FileJson className="h-6 w-6 text-indigo-600" /> Motor JSON de Preguntas
                  </DialogTitle>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
                  <Tabs defaultValue="export" className="w-full h-full flex flex-col flex-1">
                    <TabsList className="grid grid-cols-2 max-w-md mb-4 border shadow-sm bg-slate-100 shrink-0">
                      <TabsTrigger value="export" className="font-bold text-xs gap-2">
                        <Eye className="h-3.5 w-3.5" /> Ver y Copiar
                      </TabsTrigger>
                      <TabsTrigger value="edit" className="font-bold text-xs gap-2">
                        <Pencil className="h-3.5 w-3.5" /> Editar / Pegar
                      </TabsTrigger>
                    </TabsList>

                    {/* EXPORT PANEL */}
                    <TabsContent value="export" className="flex-1 flex flex-col space-y-4 min-h-0">
                      <div className="alert shadow-sm bg-slate-50 border-slate-200 flex items-start gap-3 py-3 rounded-xl">
                        <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <strong>Modo Consulta:</strong> {questions.length === 0 ? "Hemos cargado una estructura modelo estandarizada con ejemplos de Fórmulas Math, Código y Preguntas IA." : "Copia este código estructurado para pasarlo a ChatGPT, Claude u otra IA."} Vuelve a la pestaña de Editar para guardar la respuesta generada.
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0 select-none">
                        <button 
                          type="button"
                          onClick={() => setJsonViewMode('current')}
                          className={cn(
                            "px-3.5 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-wider flex items-center gap-2 shadow-sm font-sans",
                            jsonViewMode === 'current' 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20" 
                              : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                          )}
                        >
                          <AlignLeft className="h-3 w-3" /> Mi Banco Actual ({questions.length})
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setJsonViewMode('template')}
                          className={cn(
                            "px-3.5 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-wider flex items-center gap-2 shadow-sm font-sans",
                            jsonViewMode === 'template' 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20" 
                              : "bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200"
                          )}
                        >
                          <Sparkles className="h-3 w-3" /> Modelo Estándar de Referencia
                        </button>
                      </div>

                      <div className="relative flex-1 group min-h-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200">
                        <pre className="flex-1 w-full max-w-full bg-slate-950 text-green-400 font-mono text-[11px] p-5 overflow-auto shadow-inner select-all select:bg-indigo-500/40 whitespace-pre scrollbar-thin">
                          {JSON.stringify(jsonViewMode === 'template' ? DEFAULT_JSON_TEMPLATES : questions, null, 2)}
                        </pre>
                        <Button 
                          size="sm" 
                          className={cn(
                            "absolute top-3 right-3 opacity-90 font-bold shadow-lg flex gap-1.5 text-xs font-sans",
                            jsonViewMode === 'template' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                          )}
                          onClick={() => {
                            const targetCopy = jsonViewMode === 'template' ? DEFAULT_JSON_TEMPLATES : questions;
                            navigator.clipboard.writeText(JSON.stringify(targetCopy, null, 2));
                            showToast(
                              jsonViewMode === 'template' 
                                ? "Modelo de referencia copiado al portapapeles" 
                                : "Tus preguntas actuales copiadas al portapapeles", 
                              "info"
                            );
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" /> Copiar {jsonViewMode === 'template' ? "Modelo" : "Mi Banco"}
                        </Button>
                      </div>
                    </TabsContent>

                    {/* EDIT PANEL */}
                    <TabsContent value="edit" className="flex-1 flex flex-col space-y-4 min-h-0">
                      <div className="alert bg-amber-50 border-amber-200 text-amber-800 flex items-start gap-3 py-3 rounded-xl shadow-sm shrink-0">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                        <div className="text-xs leading-relaxed flex flex-col gap-0.5">
                          <span className="font-bold">Motor de Auto-Curación Inteligente Activado</span>
                          <span>Puedes pegar JSONs creados por IAs directamente. El sistema detectará automáticamente si las preguntas tienen IDs simples, nulos o duplicados, y les asignará un UUID criptográfico seguro de forma transparente.</span>
                        </div>
                      </div>

                      {jsonError && (
                        <div className="alert alert-error bg-red-50 border-red-200 text-red-700 flex items-start gap-3 py-3 rounded-xl shadow-sm shrink-0 font-bold text-xs animate-in shake">
                          <HelpCircle className="h-5 w-5 mt-0.5 shrink-0" />
                          <div>{jsonError}</div>
                        </div>
                      )}

                      <div className="flex-1 min-h-[200px] flex flex-col overflow-hidden relative border-2 border-slate-200 rounded-2xl focus-within:border-indigo-500 transition-all bg-slate-50">
                        <textarea
                          className="flex-1 w-full p-5 font-mono text-[11px] outline-none bg-slate-950 text-indigo-300 resize-none placeholder:text-slate-600 selection:bg-indigo-500/40"
                          value={rawJsonInput}
                          onChange={(e) => {
                            setRawJsonInput(e.target.value);
                            setJsonError(null);
                          }}
                          placeholder={'[\n  {\n    "type": "MULTIPLE_CHOICE",\n    "question_text": "Contenido..."\n  }\n]'}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2 shrink-0">
                        <Button variant="outline" onClick={() => setIsRawJsonOpen(false)} className="font-bold text-xs border-slate-300">
                          Cancelar
                        </Button>
                        <Button onClick={handleApplyRawJson} className="font-black text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md">
                          Validar & Sincronizar Cambios
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={handleOpenNewQuestion} className="gap-1 shadow-sm h-8 font-bold" style={{ backgroundColor: themeColor }}>
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
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Sparkles className={cn("h-5 w-5", editingId ? "text-amber-500" : "text-primary")} /> 
                        {editingId ? 'Actualizar Pregunta' : 'Editor de Pregunta'}
                      </h3>
                      <Button onClick={handleSaveQuestion} className="font-black gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm text-xs px-4 py-2 h-9 rounded-xl">
                        {editingId ? 'Guardar Cambios' : 'Añadir al Banco'}
                      </Button>
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
            <Button size="lg" onClick={handleOpenNewQuestion} className="font-bold gap-2 shadow-lg animate-bounce-once" style={{ backgroundColor: themeColor }}>
              <PlusCircle className="h-5 w-5" /> ¡Empezar a Crear Preguntas!
            </Button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <QuestionBankItem 
              key={q.id} 
              q={q} 
              idx={idx} 
              onRemove={() => removeQuestion(q.id)} 
              onEdit={() => handleStartEdit(q)}
            />
          ))
        )}
      </div>

      {/* FLOATING DAISYUI TOAST NOTIFIER */}
      {toast && (
        <div className="toast toast-top toast-end z-[9999] mt-20 mr-4 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={cn(
            "alert border-none text-xs font-black py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 select-none border-l-4 bg-slate-950 text-white",
            toast.type === 'success' && "border-l-emerald-500 text-emerald-300",
            toast.type === 'error' && "border-l-rose-500 text-rose-300",
            toast.type === 'info' && "border-l-indigo-400 text-indigo-200"
          )}>
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />}
            {toast.type === 'info' && <Info className="h-4 w-4 shrink-0 text-indigo-300" />}
            <span className="tracking-wide font-sans">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionBankItem({ q, idx, onRemove, onEdit }: { q: Question, idx: number, onRemove: () => void, onEdit: () => void }) {
  const [expanded, setExpanded] = React.useState(false);

  // Heuristic to decide if text warrants collapse mechanics
  const isLongText = q.question_text.length > 180 || q.question_text.includes("\n\n") || q.question_text.includes("```");

  return (
    <Card className="shadow-sm hover:border-indigo-500/30 hover:shadow-md transition-all duration-300 relative overflow-hidden group bg-white border-slate-200 rounded-2xl">
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1 flex gap-3 min-w-0">
          <div className="h-7 w-7 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-lg uppercase border ${
                q.type === 'AI_OPEN_QUESTION' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {q.type === 'AI_OPEN_QUESTION' ? 'Abierta IA' : 'Multi-Opción'}
              </span>
              
              {isLongText && (
                <button 
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className={cn(
                    "h-6 w-6 rounded-lg border border-slate-100 flex items-center justify-center transition-all active:scale-90 ml-auto bg-slate-50 text-slate-500 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 shadow-sm shrink-0",
                    expanded && "rotate-180 border-indigo-200 text-indigo-600 bg-white"
                  )}
                  title={expanded ? "Contraer vista" : "Expandir vista"}
                >
                  <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                </button>
              )}
            </div>

            <div className={cn(
              "relative font-medium text-sm leading-relaxed text-slate-800 prose prose-slate prose-sm prose-p:leading-relaxed w-full max-w-full overflow-x-auto break-words font-sans",
              isLongText && !expanded && "max-h-[110px] overflow-hidden"
            )}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                {q.question_text}
              </ReactMarkdown>
              {isLongText && !expanded && (
                <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 items-center shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0 h-8 w-8 rounded-xl opacity-40 group-hover:opacity-100 transition-all" 
            onClick={onEdit}
            title="Editar pregunta"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 h-8 w-8 rounded-xl opacity-40 group-hover:opacity-100 transition-all" 
            onClick={onRemove}
            title="Eliminar pregunta"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
