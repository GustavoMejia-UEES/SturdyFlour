"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadCourseDefinition, addUnitToCourse } from '@/lib/actions/admin';
import { ExamBuilder } from '@/components/admin/exam-builder';
import type { Question, CourseDefinition } from '@/lib/types/course';
import { Loader2, UploadCloud, CheckCircle, AlertCircle, Code, LayoutTemplate, Sparkles, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function ImportForm() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const contextCourseId = searchParams.get("courseId");
  const courseName = searchParams.get("name");
  const themeColor = searchParams.get("c") || "#2563eb"; // Default tailwind blue-600

  // Visual Form State
  const [visualData, setVisualData] = useState({
    code: "",
    name: "",
    instructor: "",
    unitTitle: "",
    examTitle: "Diagnóstica 1"
  });
  const [visualQuestions, setVisualQuestions] = useState<Question[]>([]);

  async function runUpload(payloadStr: string) {
    setLoading(true);
    setStatus(null);
    try {
      // If we have a contextCourseId, we should not be pasting full JSON tree usually, 
      // but we can support it as overwrite. For now, standard upload is fine.
      await uploadCourseDefinition(payloadStr);
      setStatus({ type: 'success', message: 'Contenido publicado y sincronizado exitosamente. Redirigiendo...' });
      setTimeout(() => {
        router.push(contextCourseId ? `/course/${contextCourseId}` : '/cursos');
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleVisualPublish() {
    // Validation rules differ based on Mode
    const isAppendMode = !!contextCourseId;
    
    if (!isAppendMode && (!visualData.code || !visualData.name || !visualData.instructor)) {
      setStatus({ type: 'error', message: "Debes ingresar el código, nombre y docente para crear un curso nuevo." });
      return;
    }
    
    if (!visualData.unitTitle || visualQuestions.length === 0) {
      setStatus({ type: 'error', message: "Debes ingresar un título para la Unidad y al menos 1 pregunta." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      if (isAppendMode) {
        // ATOMIC APPEND MODE: We only push ONE unit.
        const payload = {
          unit_title: visualData.unitTitle,
          assessments: [
            {
              test_id: `T${Date.now().toString().slice(-4)}`, // generated dynamic simple ID
              test_title: visualData.examTitle,
              type: "PRACTICE",
              questions: visualQuestions
            }
          ]
        };
        await addUnitToCourse(contextCourseId, payload);
      } else {
        // LEGACY OVERWRITE MODE: Total tree building.
        const fullPayload: CourseDefinition = {
          course_id: visualData.code,
          course_name: visualData.name,
          instructor: visualData.instructor,
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
        await uploadCourseDefinition(JSON.stringify(fullPayload));
      }

      setStatus({ type: 'success', message: '¡Éxito! Contenido añadido perfectamente. Redirigiendo...' });
      setTimeout(() => {
        router.push(contextCourseId ? `/course/${contextCourseId}` : '/cursos');
        router.refresh();
      }, 1500);

    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* DYNAMIC THEMED TOPBAR */}
      {contextCourseId && (
        <div className="fixed top-0 left-0 right-0 h-16 z-50 border-b flex items-center px-6 bg-white/90 backdrop-blur-md transition-all shadow-sm">
          <div className="w-1/3">
            <Link href={`/course/${contextCourseId}`} className="inline-flex items-center gap-2 text-sm font-bold transition-all" style={{ color: themeColor }}>
              <ArrowLeft className="h-4 w-4" /> Volver al Panel
            </Link>
          </div>
          <div className="w-1/3 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Estás Editando</span>
            <h2 className="text-sm font-extrabold truncate max-w-xs text-slate-800 border-b-2 leading-tight" style={{ borderBottomColor: themeColor }}>
              {courseName || "Curso Actual"}
            </h2>
          </div>
          <div className="w-1/3 flex justify-end">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
          </div>
        </div>
      )}

      <div className={cn("mb-8", contextCourseId ? "mt-12" : "")}>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {contextCourseId ? "Añadir Nueva Unidad" : "Editor de Contenidos Global"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {contextCourseId ? "Inserta nuevo material didáctico directamente en el curso actual." : "Construye mallas curriculares visualmente o mediante exportación directa."}
            </p>
          </div>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg border flex gap-3 items-start mb-6 animate-in fade-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
          <div>
            <div className="font-bold">{status.type === 'success' ? "Éxito" : "Fallo"}</div>
            <div className="text-sm whitespace-pre-wrap">{status.message}</div>
          </div>
        </div>
      )}

      <Tabs defaultValue="visual" className="w-full space-y-6">
        {!contextCourseId && (
          <TabsList className="grid w-full grid-cols-2 max-w-md border h-11 shadow-sm">
            <TabsTrigger value="visual" className="font-bold gap-2"><LayoutTemplate className="h-4 w-4"/> Modo Constructor</TabsTrigger>
            <TabsTrigger value="raw" className="font-bold gap-2"><Code className="h-4 w-4"/> Pegar JSON Puro</TabsTrigger>
          </TabsList>
        )}

        {/* VISUAL BUILDER TAB */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-md h-fit sticky top-24 bg-white" style={{ borderTop: `4px solid ${themeColor}` }}>
              <CardHeader>
                <CardTitle className="text-lg">{contextCourseId ? "Datos de la Unidad" : "Datos del Curso"}</CardTitle>
                <CardDescription>Describe el bloque temático.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!contextCourseId && (
                  <>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold">Código Curso</Label>
                      <Input placeholder="Ej: PY-101" value={visualData.code} onChange={e => setVisualData({...visualData, code: e.target.value})}/>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold">Nombre Curso</Label>
                      <Input placeholder="Introducción a Python" value={visualData.name} onChange={e => setVisualData({...visualData, name: e.target.value})}/>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold">Docente</Label>
                      <Input placeholder="Nombre y Apellido" value={visualData.instructor} onChange={e => setVisualData({...visualData, instructor: e.target.value})}/>
                    </div>
                    <hr className="my-2 opacity-50"/>
                  </>
                )}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold" style={{ color: themeColor }}>Título de Unidad*</Label>
                  <Input className="focus:ring-blue-500" placeholder="Ej: Unidad 1: Conceptos Básicos" value={visualData.unitTitle} onChange={e => setVisualData({...visualData, unitTitle: e.target.value})} style={{ borderColor: `${themeColor}30` }}/>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-bold">Título del Examen/Quiz*</Label>
                  <Input placeholder="Evaluación Semanal 1" value={visualData.examTitle} onChange={e => setVisualData({...visualData, examTitle: e.target.value})}/>
                </div>
                <Button 
                  onClick={handleVisualPublish} 
                  disabled={loading} 
                  className="w-full font-bold gap-2 py-6 text-base shadow-md transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: themeColor }}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                  {loading ? "Procesando..." : (contextCourseId ? "Cargar al Curso" : "Publicar Estructura")}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md border-t-4 border-t-indigo-500 bg-white">
              <CardHeader className="bg-slate-50/50 border-b pb-4 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-indigo-600"/> Banco de Preguntas</CardTitle>
                <CardDescription>Construye el banco interactivo que verán los estudiantes.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExamBuilder 
                  onChange={(qs) => setVisualQuestions(qs)} 
                  initialQuestions={visualQuestions} 
                  themeColor={themeColor}
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
