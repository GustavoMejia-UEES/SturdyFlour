import { Navbar } from '@/components/shared/navbar';
import { Metadata } from 'next';
import { DynamicImportForm } from '@/components/admin/dynamic-import-form';

export const metadata: Metadata = {
  title: 'Administración de Contenidos',
};

export const runtime = 'edge';

export default function AdminImportPage() {
  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <Navbar />
      <main className="container mx-auto py-12 max-w-5xl px-4">
        <DynamicImportForm />
      </main>
    </div>
  );
}
