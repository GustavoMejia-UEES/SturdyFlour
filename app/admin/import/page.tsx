import { Navbar } from '@/components/shared/navbar';
import { ImportForm } from '@/components/admin/import-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administración de Contenidos',
};

export const runtime = 'edge';

export default function AdminImportPage() {
  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <Navbar />
      <main className="container mx-auto py-12 max-w-5xl px-4">
        <ImportForm />
      </main>
    </div>
  );
}
