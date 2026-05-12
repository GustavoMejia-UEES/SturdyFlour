'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BrainCircuit, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Success, redirect immediately to dashboard!
      router.push('/cursos');
      router.refresh(); // force server re-validation for layouts
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-radial-[at_50%_-20%] from-primary/10 to-background">
      
      {/* Design background background details */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      
      <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2 hover:opacity-80 transition-all">
        <div className="h-8 w-8 relative flex items-center justify-center">
          <img 
            src="/Logo.png" 
            alt="Logo" 
            className="h-full w-full object-contain"
          />
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">SturdyFlour</span>
      </Link>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="h-3 w-3 fill-primary" /> Acceso Privado
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenido de nuevo</h1>
          <p className="text-muted-foreground">Ingresa tus credenciales académicas.</p>
        </div>

        <Card className="border border-primary/10 shadow-2xl bg-card/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pb-8">
            <CardTitle className="flex items-center gap-2 font-bold">
              <BrainCircuit className="h-5 w-5 text-primary" /> Iniciar Sesión
            </CardTitle>
            <CardDescription>Completa el formulario para acceder al repositorio.</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@correo.com"
                    className="pl-10 h-11 rounded-xl focus-visible:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-xl focus-visible:ring-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in">
                  ⚠️ {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl font-bold text-base transition-all bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                  </>
                ) : (
                  'Ingresar al Repositorio'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="bg-muted/30 flex justify-center py-4 border-t text-xs text-muted-foreground">
            Solo personal autorizado. Desarrollado con Edge Computing.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
