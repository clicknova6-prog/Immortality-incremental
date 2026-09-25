import { useMemo } from 'react';
import type { Decimal } from '../../core/decimal';
import { getStat } from '../../core/multipliers';
import type { Stat } from '../../data/stats';
import { useGameStore } from '../../store/gameStore';

/** Current value of a pipeline stat. Re-renders on committed ticks (≤10/s). */
export function useStat(stat: Stat): Decimal {
  const game = useGameStore((s) => s.game);
  return useMemo(() => getStat(game, stat), [game, stat]);
}
