import { Suspense } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { ImportForm } from '@/components/admin/import-form';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Administración de Contenidos',
};

export const runtime = 'edge';

export default function AdminImportPage() {
  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <Navbar />
      <main className="container mx-auto py-12 max-w-5xl px-4">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-2" />
            <p className="text-slate-500 text-sm">Cargando editor...</p>
          </div>
        }>
          <ImportForm />
        </Suspense>
      </main>
    </div>
  );
}
