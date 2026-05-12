'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detect dynamic bundle/chunk load errors caused by stale deployments!
    const errorMsg = error.message?.toLowerCase() || '';
    const isChunkError = 
      errorMsg.includes('chunkloaderror') || 
      errorMsg.includes('loading chunk') || 
      errorMsg.includes('failed to fetch') ||
      errorMsg.includes('dynamically imported module');

    if (isChunkError) {
      console.warn('Stale Asset detected (ChunkLoadError). Initiating self-healing hard refresh...');
      // Delay slightly to prevent infinite reload loops
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Standard error logging for other cases
    console.error('Root runtime error captured:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full text-center bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="h-16 w-16 bg-cyan-950/40 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        
        <h2 className="text-2xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-300">
          Actualizando Plataforma
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Hemos detectado una nueva versión del sistema en el servidor. Estamos sincronizando tus archivos para evitar conflictos. Esto tardará un segundo.
        </p>

        <button
          onClick={async () => {
            try {
              // AGGRESSIVE BROWSER CACHE PURGING FOR TOTAL RESET
              if ('caches' in window) {
                const keys = await window.caches.keys();
                await Promise.all(keys.map(key => window.caches.delete(key)));
              }
              window.sessionStorage.clear();
              window.localStorage.removeItem('supabase.auth.token'); // example clear if any
            } catch (e) {
              console.error("Forced cache wipe partially failed", e);
            }
            // Force reload bypassing cache
            window.location.href = window.location.origin + window.location.pathname + '?sync=' + Date.now() + window.location.search.replace(/^\?/, '&');
          }}
          className="w-full inline-flex items-center justify-center gap-2 h-11 px-6 font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" /> Forzar Sincronización
        </button>
      </div>
    </div>
  );
}
