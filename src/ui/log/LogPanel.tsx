import { useGameStore } from '../../store/gameStore';

export function LogPanel() {
  const log = useGameStore((s) => s.ui.log);
  return (
    <aside aria-label="Log" className="panel hidden w-64 shrink-0 flex-col p-3 lg:flex">
      <h2 className="font-display mb-2 text-sm tracking-wider text-gold-300">Chronicle</h2>
      <ul className="space-y-1.5 overflow-y-auto text-xs text-slate-400">
        {log.map((entry) => (
          <li key={entry.id}>
            <span className="text-slate-600">
              {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>{' '}
            {entry.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
