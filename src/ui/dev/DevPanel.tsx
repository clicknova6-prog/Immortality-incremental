import { useState } from 'react';
import { formatTime } from '../../core/format';
import { runPacingSim, type PacingResult } from '../../core/pacing';
import { createInitialState } from '../../core/state';
import { resources } from '../../data/resources';
import { useActions, useGameStore } from '../../store/gameStore';

const SKIPS = [
  { label: '+1 min', seconds: 60 },
  { label: '+1 hour', seconds: 3600 },
  { label: '+1 day', seconds: 86400 },
];

/** Development-only tools. Rendered only when import.meta.env.DEV. */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? 'qi');
  const [amount, setAmount] = useState('1e6');
  const [simHours, setSimHours] = useState(1);
  const [sim, setSim] = useState<PacingResult | null>(null);
  const flags = useGameStore((s) => s.game.flags);
  const { skipTime, devAddResource, devSetFlag } = useActions();

  if (!open) {
    return (
      <button
        type="button"
        className="btn fixed right-2 bottom-20 z-40 border border-gold-500/50 text-xs md:bottom-2"
        onClick={() => setOpen(true)}
      >
        🛠 Dev
      </button>
    );
  }

  return (
    <div className="panel fixed right-2 bottom-20 z-40 max-h-[70vh] w-80 space-y-3 overflow-y-auto border-gold-500/50 p-3 text-xs md:bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gold-300">🛠 Dev panel</h2>
        <button type="button" className="btn px-2 py-0.5" onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-slate-400">Time skip</p>
        <div className="flex gap-1">
          {SKIPS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="btn"
              onClick={() => skipTime(s.seconds, 'dev')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-slate-400">Add currency</p>
        <div className="flex gap-1">
          <select
            className="rounded bg-ink-800 px-1"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            className="w-20 rounded bg-ink-800 px-1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="button" className="btn" onClick={() => devAddResource(resourceId, amount)}>
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="btn"
          onClick={() => devSetFlag('unlockAll', !flags.unlockAll)}
        >
          Unlock all: {flags.unlockAll ? 'ON' : 'off'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => devSetFlag('devBoost', !flags.devBoost)}
        >
          ×1000 boost: {flags.devBoost ? 'ON' : 'off'}
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-slate-400">Pacing simulator (fresh save, idealized bot)</p>
        <div className="flex gap-1">
          <input
            type="number"
            min={0.1}
            step={0.5}
            className="w-16 rounded bg-ink-800 px-1"
            value={simHours}
            onChange={(e) => setSimHours(Number(e.target.value))}
          />
          <span className="self-center">hours</span>
          <button
            type="button"
            className="btn"
            onClick={() => setSim(runPacingSim(createInitialState(), simHours))}
          >
            Run
          </button>
        </div>
        {sim && (
          <table className="w-full">
            <tbody>
              {sim.hits.map((h) => (
                <tr key={h.id}>
                  <td>{h.label}</td>
                  <td className="text-right text-jade-300">{formatTime(h.atSeconds)}</td>
                  <td className="text-right text-slate-500">
                    {h.targetSeconds !== null ? `target ${formatTime(h.targetSeconds)}` : ''}
                  </td>
                </tr>
              ))}
              {sim.missed.map((m) => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td className="text-right text-red-400">not reached</td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
