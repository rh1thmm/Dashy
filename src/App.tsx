import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  const [phase, setPhase] = useState<'splash' | 'fade' | 'live'>('splash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 500);
    const t2 = setTimeout(() => setPhase('live'), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'live') {
    return (
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
  }

  return (
    <div className={`fixed inset-0 bg-bone z-[9999] flex flex-col items-center justify-center transition-opacity duration-400 ease-out ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <h1 className="font-serif text-5xl tracking-[0.3em] uppercase text-charcoal">dashy</h1>
    </div>
  );
}

export default App;
