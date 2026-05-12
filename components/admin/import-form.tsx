"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadCourseDefinition } from '@/lib/actions/admin';
import { ExamBuilder } from '@/components/admin/exam-builder';
import type { Question, CourseDefinition } from '@/lib/types/course';
import { Loader2, UploadCloud, CheckCircle, AlertCircle, Code, LayoutTemplate, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ImportForm() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const router = useRouter();

  // Visual Form State
  const [visualData, setVisualData] = useState({
    code: "",
    name: "",
    instructor: "",
    unitTitle: "Unidad Principal",
    examTitle: "Evaluación 1"
  });
  const [visualQuestions, setVisualQuestions] = useState<Question[]>([]);

  async function runUpload(payloadStr: string) {
    setLoading(true);
    setStatus(null);
    try {
      await uploadCourseDefinition(payloadStr);
      setStatus({ type: 'success', message: 'Contenido publicado y sincronizado exitosamente. Redirigiendo...' });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  function handleVisualPublish() {
    if (!visualData.code || !visualData.name || visualQuestions.length === 0) {
      setStatus({ type: 'error', message: "Completa los campos obligatorios y añade al menos 1 pregunta." });
      return;
    }

    // Convert visual state into the strictly compliant JSON Schema structure
    const fullPayload: CourseDefinition = {
      course_id: visualData.code,
      course_name: visualData.name,
      instructor: visualData.instructor || "Por asignar",
      syllabus: [
        {
          unit_id: "U1",
          unit_title: visualData.unitTitle,
          assessments: [
            {
              test_id: "T1",
              test_title: visualData.examTitle,
              type: "PRACTICE",
              questions: visualQuestions
            }
          ]
        }
      ]
    };

    runUpload(JSON.stringify(fullPayload, null, 2));
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Editor de Contenidos</h1>
          <p className="text-muted-foreground">Construye mallas curriculares visualmente o mediante exportación directa.</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg border flex gap-3 items-start mb-6 animate-in fade-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
          <div>
            <div className="font-bold">{status.type === 'success' ? "Éxito" : "Error de Proceso"}</div>
            <div className="text-sm whitespace-pre-wrap">{status.message}</div>
          </div>
        </div>
      )}

      <Tabs defaultValue="visual" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md border h-11 shadow-sm">
          <TabsTrigger value="visual" className="font-bold gap-2"><LayoutTemplate className="h-4 w-4"/> Modo Constructor</TabsTrigger>
          <TabsTrigger value="raw" className="font-bold gap-2"><Code className="h-4 w-4"/> Pegar JSON Puro</TabsTrigger>
        </TabsList>

        {/* VISUAL BUILDER TAB */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-sm h-fit sticky top-24 border-t-4 border-t-blue-600">
              <CardHeader>
                <CardTitle>Datos del Curso</CardTitle>
                <CardDescription>Configura la identidad base.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Código del Curso</Label>
                  <Input placeholder="Ej: PY-101" value={visualData.code} onChange={e => setVisualData({...visualData, code: e.target.value})}/>
                </div>
                <div className="grid gap-2">
                  <Label>Nombre del Curso</Label>
                  <Input placeholder="Introducción a Python" value={visualData.name} onChange={e => setVisualData({...visualData, name: e.target.value})}/>
                </div>
                <div className="grid gap-2">
                  <Label>Docente</Label>
                  <Input placeholder="Nombre y Apellido" value={visualData.instructor} onChange={e => setVisualData({...visualData, instructor: e.target.value})}/>
                </div>
                <hr className="my-2"/>
                <div className="grid gap-2">
                  <Label>Nombre Unidad/Semana</Label>
                  <Input placeholder="Semana 1: Sintaxis" value={visualData.unitTitle} onChange={e => setVisualData({...visualData, unitTitle: e.target.value})}/>
                </div>
                <div className="grid gap-2">
                  <Label>Título del Examen</Label>
                  <Input placeholder="Quiz Rápido" value={visualData.examTitle} onChange={e => setVisualData({...visualData, examTitle: e.target.value})}/>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4">
                <Button className="w-full font-black gap-2" onClick={handleVisualPublish} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4" />}
                  Publicar Estructura
                </Button>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-t-4 border-t-indigo-500">
              <CardHeader className="bg-slate-50/50 border-b pb-4 mb-4">
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-600"/> Diseño de Preguntas</CardTitle>
                <CardDescription>Añade preguntas autocorregibles o basadas en análisis IA.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExamBuilder 
                  onChange={(qs) => setVisualQuestions(qs)} 
                  initialQuestions={visualQuestions} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RAW JSON TAB */}
        <TabsContent value="raw">
          <Card className="border-2 shadow-md overflow-hidden border-t-4 border-t-slate-800">
            <CardHeader className="bg-slate-50/80">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-slate-700" />
                Importar Estructura Cruda
              </CardTitle>
              <CardDescription>
                Pega un árbol de datos JSON completo que contenga múltiples unidades y exámenes de una sola vez.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-y">
              <textarea
                className="w-full h-96 font-mono text-xs p-6 bg-slate-950 text-green-400 outline-none focus:ring-2 ring-primary/50 transition-all"
                placeholder={`{\n  "course_id": "PY-101",\n  "course_name": "Python Essentials",\n  "instructor": "Ing. Perez",\n  "syllabus": [...]\n}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                disabled={loading}
              />
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-4 py-4">
              <Button variant="outline" disabled={loading} onClick={() => setJsonInput("")}>Limpiar</Button>
              <Button onClick={() => runUpload(jsonInput)} disabled={loading || !jsonInput.trim()} className="font-bold gap-2">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <><UploadCloud className="h-4 w-4"/> Validar & Guardar</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
