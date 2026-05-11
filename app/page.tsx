import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { BrainCircuit, FileText, GraduationCap, Sparkles } from "lucide-react";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 bg-radial-[at_50%_-20%] from-slate-100 to-background dark:from-slate-900">
        
        <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="h-4 w-4 mr-2 fill-yellow-500 text-yellow-500" />
          El repositorio universitario potenciado por IA
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
          Transforma tus Slides PDF en <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Exámenes Prácticos</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
          Sube tus diapositivas, selecciona la materia y deja que la IA genere simuladores de examen precisos para que apruebes con honores.
        </p>

        <div className="flex gap-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-lg font-semibold gap-2">
                <GraduationCap /> Ir al Dashboard
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="h-12 px-8 text-lg font-semibold gap-2">
                Empezar Ahora Gratis <BrainCircuit />
              </Button>
            </SignInButton>
          </SignedOut>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <FeatureCard 
            icon={<FileText className="h-6 w-6 text-primary" />}
            title="Carga de PDFs Directa"
            description="Tus diapositivas de clase guardadas y listas para procesar al instante usando Cloudflare R2."
          />
          <FeatureCard 
            icon={<BrainCircuit className="h-6 w-6 text-primary" />}
            title="IA de Alta Precisión"
            description="Alimentado por Google Gemini para capturar conceptos complejos y fórmulas."
          />
          <FeatureCard 
            icon={<GraduationCap className="h-6 w-6 text-primary" />}
            title="Simulador de Examen"
            description="Practica con límite de tiempo, selección múltiple y feedback en tiempo real."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
      <div className="mb-4 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
