import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAuthenticatedProfile } from "@/lib/auth/session";

export async function Navbar() {
  const profile = await getAuthenticatedProfile();
  const isSignedIn = !!profile;

  return (
    <header className="border-b border-white/5 bg-[#030712]/90 backdrop-blur-xl sticky top-0 z-50 text-white shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group">
          <div className="h-10 w-10 relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full group-hover:bg-cyan-500/40 transition-all" />
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="h-full w-full object-contain relative z-10 drop-shadow-[0_0_10px_rgba(0,255,200,0.3)]"
            />
          </div>
          <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-cyan-200">SturdyFlour</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="font-bold text-sm text-slate-300 hover:text-cyan-300 hover:bg-white/5 transition-all">Dashboard</Button>
              </Link>
              <div className="border-l border-white/10 pl-4 h-8 flex items-center gap-3">
                <span className="text-sm font-bold text-cyan-400 hidden sm:inline-block tracking-tight bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900/50">
                  {profile.name || profile.email}
                </span>
                <form action="/api/auth/logout" method="POST">
                  <Button type="submit" variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/5 hover:bg-red-500/20 hover:text-red-400 font-bold text-xs px-4 transition-all">
                    Salir
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button className="font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,255,200,0.1)] bg-cyan-500 hover:bg-cyan-400 hover:scale-105 text-slate-950 border-none rounded-xl px-6 transition-all">
                INICIAR SESIÓN
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
