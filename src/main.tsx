import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);
const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (supabaseConfigured) {
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
      <div className="max-w-md rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-navy-900">Connection settings are missing</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          CampusConnect cannot reach its database because the Supabase connection settings are not available in this
          environment. Once they are provided, the app will load.
        </p>
      </div>
    </div>,
  );
}
