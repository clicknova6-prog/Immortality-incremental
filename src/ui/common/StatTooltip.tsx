import { useMemo, useState, type ReactNode } from 'react';
import { format } from '../../core/format';
import { getMultiplierBreakdown } from '../../core/multipliers';
import { statLabels, type Stat } from '../../data/stats';
import { useGameStore } from '../../store/gameStore';

interface StatTooltipProps {
  stat: Stat;
  children: ReactNode;
  /** Use 'right' near the right screen edge so the card opens leftwards. */
  align?: 'center' | 'right';
}

const ALIGN_CLASSES = {
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
} as const;

/** Wraps a number and shows "why is it this value?" on hover/focus/tap. */
export function StatTooltip({ stat, children, align = 'center' }: StatTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-block cursor-help underline decoration-dotted decoration-ink-600 underline-offset-4"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      {children}
      {open && <BreakdownCard stat={stat} align={align} />}
    </span>
  );
}

function BreakdownCard({ stat, align }: { stat: Stat; align: 'center' | 'right' }) {
  const game = useGameStore((s) => s.game);
  const breakdown = useMemo(() => getMultiplierBreakdown(game, stat), [game, stat]);
  return (
    <span
      className={`panel absolute top-full z-40 mt-2 block w-64 bg-ink-900 p-3 ${ALIGN_CLASSES[align]} text-left text-xs font-normal text-slate-300 no-underline shadow-xl`}
    >
      <span className="mb-2 block font-semibold text-gold-300">{statLabels[stat]} breakdown</span>
      {breakdown.entries.map((e) => (
        <span key={`${e.id}-${e.kind}`} className="flex justify-between gap-2">
          <span>{e.label}</span>
          <span className={e.kind === 'mult' ? 'text-jade-300' : 'text-slate-100'}>
            {e.kind === 'mult' ? '×' : e.kind === 'add' ? '+' : ''}
            {format(e.value)}
          </span>
        </span>
      ))}
      <span className="mt-2 flex justify-between border-t border-ink-700 pt-2 font-semibold">
        <span>
          ({format(breakdown.additiveTotal)}) × {format(breakdown.multTotal)}
        </span>
        <span className="text-gold-300">= {format(breakdown.total)}</span>
      </span>
    </span>
  );
}
