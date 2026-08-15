import { t } from './i18n';

export default function App() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-xl font-bold">{t('app.name')}</h1>
    </main>
  );
}
