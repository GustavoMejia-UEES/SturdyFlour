"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Safe Client-Only isolation shell for Radix components loaded within Import Engine
export const DynamicImportForm = dynamic(
  () => import('./import-form').then((mod) => mod.ImportForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-2" />
        <p className="text-slate-400 font-medium text-sm">Inicializando editor dinámico...</p>
      </div>
    ),
  }
);
