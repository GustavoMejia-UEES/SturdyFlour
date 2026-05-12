"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { UnifiedSimulatorProps } from './unified-simulator';

// Fully isolated dynamic loader that safely executes ONLY on browser environments
export const DynamicSimulator = dynamic<UnifiedSimulatorProps>(
  () => import('./unified-simulator').then(mod => mod.UnifiedSimulator),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-950/5 rounded-3xl border border-slate-100 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mb-4" />
        <p className="text-slate-600 font-bold tracking-tight text-lg">Cargando Simulador IA</p>
        <p className="text-slate-400 text-xs mt-1">Sincronizando motores de evaluación...</p>
      </div>
    )
  }
);
