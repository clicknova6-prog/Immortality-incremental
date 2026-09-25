import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from '../../core/format';
import { useActions, useGameStore } from '../../store/gameStore';
import { StatTooltip } from '../common/StatTooltip';
import { useStat } from '../hooks/useStat';

interface Pop {
  id: number;
  x: number;
  text: string;
}

let popId = 0;

export function CultivatePanel() {
  const { cultivate } = useActions();
  const perClick = useStat('qiPerClick');
  const animations = useGameStore((s) => s.game.settings.animations);
  const [pops, setPops] = useState<Pop[]>([]);

  const onClick = (): void => {
    cultivate();
    if (!animations) return;
    const pop = { id: ++popId, x: Math.random() * 80 - 40, text: `+${format(perClick)}` };
    setPops((p) => [...p.slice(-10), pop]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== pop.id)), 800);
  };

  return (
    <section className="flex flex-col items-center gap-6 py-8">
      <p className="text-center text-sm text-slate-400">
        Draw the heavens' Qi into your meridians. <kbd className="text-slate-300">Space</kbd> also
        cultivates.
      </p>
      <div className="relative">
        <motion.button
          type="button"
          onClick={onClick}
          whileTap={animations ? { scale: 0.93 } : undefined}
          className="font-display relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-jade-400/60 bg-radial from-jade-700 to-ink-900 text-xl tracking-widest text-jade-300 shadow-[0_0_40px_-5px] shadow-jade-500/50 hover:shadow-jade-400/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/60"
        >
          Cultivate
        </motion.button>
        <AnimatePresence>
          {pops.map((p) => (
            <motion.span
              key={p.id}
              className="pointer-events-none absolute top-0 left-1/2 font-semibold text-gold-300"
              initial={{ opacity: 1, y: 0, x: p.x }}
              animate={{ opacity: 0, y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {p.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <p className="text-sm text-slate-300">
        <StatTooltip stat="qiPerClick">{format(perClick)}</StatTooltip> Qi per click
      </p>
    </section>
  );
}
