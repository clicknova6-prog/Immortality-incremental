import { memo } from 'react';
import { format } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { StatTooltip } from '../common/StatTooltip';
import { useStat } from '../hooks/useStat';

const QiReadout = memo(function QiReadout() {
  const qi = useGameStore((s) => s.game.qi);
  return (
    <div className="flex items-baseline gap-2">
      <span aria-hidden>🌀</span>
      <span className="font-display text-lg text-jade-300 tabular-nums">{format(qi)}</span>
      <span className="text-xs text-slate-400">Qi</span>
    </div>
  );
});

const QiRate = memo(function QiRate() {
  const rate = useStat('qiPerSec');
  return (
    <div className="text-sm text-slate-300 tabular-nums">
      <StatTooltip stat="qiPerSec" align="right">
        {format(rate)}
      </StatTooltip>
      <span className="text-slate-500"> /s</span>
    </div>
  );
});

export function Hud() {
  return (
    <header className="panel relative z-20 flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
      <h1 className="font-display mr-auto text-base tracking-widest text-gold-300 sm:text-lg">
        ☯ Ascension Incremental
      </h1>
      <QiReadout />
      <QiRate />
    </header>
  );
}
