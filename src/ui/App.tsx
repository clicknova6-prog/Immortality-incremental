import { lazy, Suspense } from 'react';
import { useGameStore } from '../store/gameStore';
import { CultivatePanel } from './cultivate/CultivatePanel';
import { Hud } from './hud/Hud';
import { useKeyboard } from './hooks/useKeyboard';
import { LogPanel } from './log/LogPanel';
import { OfflineModal } from './offline/OfflineModal';
import { SettingsPanel } from './settings/SettingsPanel';
import { Sidebar } from './sidebar/Sidebar';

// Code-split so the dev panel never ships in production builds.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('./dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

const PARTICLE_COUNT = 24;

function Particles() {
  const enabled = useGameStore((s) => s.game.settings.particles);
  if (!enabled) return null;
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDuration: `${12 + ((i * 7) % 14)}s`,
            animationDelay: `${(i * 1.3) % 12}s`,
          }}
        />
      ))}
    </div>
  );
}

function ActivePanel() {
  const panel = useGameStore((s) => s.ui.panel);
  switch (panel) {
    case 'cultivate':
      return <CultivatePanel />;
    case 'settings':
      return <SettingsPanel />;
  }
}

export function App() {
  useKeyboard();
  return (
    <div className="relative flex min-h-full flex-col gap-2 bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950 p-2 pb-20 md:pb-2">
      <Particles />
      <Hud />
      <div className="relative z-10 flex flex-1 gap-2">
        <Sidebar />
        <main className="panel min-w-0 flex-1 p-4">
          <ActivePanel />
        </main>
        <LogPanel />
      </div>
      <OfflineModal />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </div>
  );
}
