import { useCallback, useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import Footer from './components/Footer';
import Header from './components/Header';
import PrintReport from './components/PrintReport';
import SummaryPanel from './components/SummaryPanel';
import WelcomeScreen from './components/WelcomeScreen';
import WiringDiagram from './components/WiringDiagram';
import { STORAGE_KEYS, readStorage, writeStorage } from './lib/storage';
import { useTheme } from './lib/useTheme';
import { computeInstallation } from './rules/electricalRules';
import { useElecStore } from './store/useElecStore';

export default function App() {
  const components = useElecStore((s) => s.components);
  const settings = useElecStore((s) => s.settings);
  const installation = useMemo(() => computeInstallation(components, settings), [components, settings]);
  const { theme, toggle } = useTheme();
  const [welcomeOpen, setWelcomeOpen] = useState(() => readStorage(STORAGE_KEYS.welcomeSeen) !== '1');

  const closeWelcome = useCallback(() => {
    writeStorage(STORAGE_KEYS.welcomeSeen, '1');
    setWelcomeOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onToggleTheme={toggle} onHelp={() => setWelcomeOpen(true)} />
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 items-start gap-4 p-3 sm:p-4 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)_370px] print:hidden">
        <ConfigPanel />
        <div className="lg:sticky lg:top-[76px]">
          <WiringDiagram installation={installation} />
        </div>
        <SummaryPanel installation={installation} />
      </main>
      <PrintReport installation={installation} phaseColor={settings.phaseColor} />
      <Footer />
      <WelcomeScreen open={welcomeOpen} onClose={closeWelcome} />
    </div>
  );
}
