import type { PanelId } from '../../store/gameStore';
import { useActions, useGameStore } from '../../store/gameStore';

interface NavItem {
  id: PanelId | string;
  label: string;
  icon: string;
  /** Items without a panel yet are shown locked as "???". */
  available: boolean;
}

const NAV: NavItem[] = [
  { id: 'cultivate', label: 'Cultivate', icon: '🧘', available: true },
  { id: 'upgrades', label: 'Upgrades', icon: '📜', available: false },
  { id: 'breakthrough', label: 'Breakthrough', icon: '⚡', available: false },
  { id: 'layers', label: 'Layers', icon: '♻️', available: false },
  { id: 'marks', label: 'Marks', icon: '✴️', available: false },
  { id: 'beasts', label: 'Beasts', icon: '🐉', available: false },
  { id: 'shop', label: 'Shop', icon: '🎟️', available: false },
  { id: 'achievements', label: 'Achievements', icon: '🏆', available: false },
  { id: 'stats', label: 'Stats', icon: '📊', available: false },
  { id: 'settings', label: 'Settings', icon: '⚙️', available: true },
];

export function Sidebar() {
  const panel = useGameStore((s) => s.ui.panel);
  const { setPanel } = useActions();
  return (
    <nav
      aria-label="Main"
      className="panel fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto rounded-none p-1 md:static md:w-44 md:flex-col md:rounded-xl md:p-2"
    >
      {NAV.map((item) => {
        const active = item.id === panel;
        return (
          <button
            key={item.id}
            type="button"
            disabled={!item.available}
            onClick={() => item.available && setPanel(item.id as PanelId)}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs md:flex-row md:gap-2 md:text-sm ${
              active ? 'bg-jade-700/60 text-white' : 'text-slate-300 hover:bg-ink-700'
            } disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent`}
          >
            <span aria-hidden>{item.available ? item.icon : '🔒'}</span>
            <span>{item.available ? item.label : '???'}</span>
          </button>
        );
      })}
    </nav>
  );
}
