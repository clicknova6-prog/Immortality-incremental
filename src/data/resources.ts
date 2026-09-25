import type { Decimal } from '../core/decimal';
import type { GameState } from '../core/state';

export interface ResourceDef {
  id: string;
  name: string;
  icon: string;
  get: (state: GameState) => Decimal;
}

/** Resources tracked in the offline report, dev panel and HUD. */
export const resources: ResourceDef[] = [{ id: 'qi', name: 'Qi', icon: '🌀', get: (s) => s.qi }];

export function findResource(id: string): ResourceDef | undefined {
  return resources.find((r) => r.id === id);
}
