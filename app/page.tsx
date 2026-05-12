import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import Link from "next/link";
import { BrainCircuit, FileText, GraduationCap, Sparkles } from "lucide-react";
import { getAuthenticatedProfile } from "@/lib/auth/session";

export const runtime = "edge";

export default async function Home() {
  const profile = await getAuthenticatedProfile();
  const isSignedIn = !!profile;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 bg-radial-[at_50%_-20%] from-primary/10 to-background relative overflow-hidden">
        
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="inline-flex items-center rounded-full border border-primary/10 px-4 py-1.5 text-sm font-semibold bg-secondary text-secondary-foreground mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="h-4 w-4 mr-2 fill-primary text-primary animate-pulse" />
          Repositorio Inteligente Potenciado por IA
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 max-w-5xl animate-in fade-in duration-700 delay-150 leading-[0.9]">
          Transforma tus Diapositivas en <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/90 to-emerald-800">Simuladores</span>
        </h1>

        <p className="text-xl text-muted-foreground/80 mb-12 max-w-2xl animate-in fade-in duration-700 delay-300 leading-relaxed">
          Procesamiento instantáneo de PDFs con IA avanzada de Gemini. Domina tus materias practicando con exámenes a tu medida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl bg-primary hover:opacity-90 text-primary-foreground gap-3 border-none group w-full sm:w-auto">
                <GraduationCap className="group-hover:scale-110 transition-transform" /> Ir al Catálogo
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl bg-primary hover:opacity-90 text-primary-foreground gap-3 border-none group w-full sm:w-auto">
                  <GraduationCap className="group-hover:scale-110 transition-transform" /> Entrar como Invitado
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-primary/20 hover:bg-primary/5 text-primary gap-3 group w-full sm:w-auto bg-white/50 backdrop-blur">
                  Administración <BrainCircuit className="group-hover:rotate-12 transition-transform opacity-70" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-28 max-w-5xl w-full text-left px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
          <FeatureCard 
            icon={<FileText className="h-6 w-6 text-primary" />}
            title="Carga Directa de PDFs"
            description="Tus diapositivas guardadas de forma segura usando Cloudflare R2 nativo."
          />
          <FeatureCard 
            icon={<BrainCircuit className="h-6 w-6 text-primary" />}
            title="Motores Gemini 1.5"
            description="Lógica de vanguardia para descomponer conceptos complejos automáticamente."
          />
          <FeatureCard 
            icon={<GraduationCap className="h-6 w-6 text-primary" />}
            title="Modo Simulación"
            description="Interfaz inmersiva con retroalimentación inmediata para maximizar retención."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl border border-primary/5 bg-background/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
        <div className="group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight text-foreground">{title}</h3>
      <p className="text-muted-foreground/90 leading-relaxed text-[0.95rem]">{description}</p>
    </div>
  )
}
