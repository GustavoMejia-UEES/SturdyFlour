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
    <div className="flex flex-col min-h-screen bg-[#030712] text-white overflow-hidden relative">
      <Navbar />
      
      {/* ATMOSPHERIC GLOW BACKGROUNDS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none invert" />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-28 relative z-10">
        
        {/* GIANT BRANDED LOGO HERO */}
        <div className="mb-6 transform hover:scale-105 hover:-translate-y-2 transition-all duration-700 cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-purple-600 blur-3xl opacity-20 rounded-full scale-75 group-hover:opacity-40" />
            <img 
              src="/Logo.png" 
              alt="Cyber Logo" 
              className="h-40 w-40 md:h-52 md:w-52 object-contain drop-shadow-[0_0_30px_rgba(0,255,200,0.3)] relative z-10"
            />
          </div>
        </div>

        <div className="inline-flex items-center rounded-full border border-cyan-500/30 px-4 py-1.5 text-sm font-bold bg-cyan-950/40 backdrop-blur text-cyan-300 mb-8 shadow-[0_0_15px_rgba(0,255,200,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="h-4 w-4 mr-2 fill-cyan-400 text-cyan-400 animate-pulse" />
          Plataforma UEES Edition
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 max-w-5xl animate-in fade-in duration-700 delay-150 leading-[0.95] text-white drop-shadow-2xl">
          Domina tus exámenes <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 drop-shadow-[0_0_10px_rgba(0,255,200,0.3)]">UEES</span>
        </h1>

        <p className="text-xl text-slate-300/80 mb-12 max-w-2xl animate-in fade-in duration-700 delay-300 leading-relaxed font-medium">
          Pon a prueba tus habilidades y prepárate para estar listo. Un espacio directo para unos amigos y yo para reventar las materias practicando.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          {isSignedIn ? (
            <Link href="/cursos">
              <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 gap-3 border-none group w-full sm:w-auto scale-105 transition-transform">
                <GraduationCap className="group-hover:scale-110 transition-transform" /> Ir al Catálogo
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/cursos">
                <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 gap-3 border-none group w-full sm:w-auto scale-105 transition-transform">
                  <GraduationCap className="group-hover:scale-110 transition-transform" /> Entrar como Invitado
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-white/20 hover:border-purple-400/50 hover:bg-purple-500/5 text-white gap-3 group w-full sm:w-auto bg-white/5 backdrop-blur-md transition-all">
                  Administración <BrainCircuit className="group-hover:rotate-12 transition-transform opacity-80 text-purple-400" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-28 max-w-5xl w-full text-left px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 relative z-10">
          <FeatureCard 
            icon={<FileText className="h-6 w-6 text-cyan-400" />}
            title="Carga Directa de PDFs"
            description="Tus diapositivas guardadas de forma segura usando Cloudflare R2 nativo."
          />
          <FeatureCard 
            icon={<BrainCircuit className="h-6 w-6 text-purple-400" />}
            title="Motores Gemini 1.5"
            description="Lógica de vanguardia para descomponer conceptos complejos automáticamente."
          />
          <FeatureCard 
            icon={<GraduationCap className="h-6 w-6 text-teal-400" />}
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
    <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,255,200,0.1)] hover:border-white/20 hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="mb-5 h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all duration-300 shadow-inner">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 tracking-tight text-white group-hover:text-cyan-300 transition-colors">{title}</h3>
        <p className="text-slate-300/80 leading-relaxed text-[0.95rem]">{description}</p>
      </div>
    </div>
  )
}
