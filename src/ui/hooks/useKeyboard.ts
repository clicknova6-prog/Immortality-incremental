import { useEffect } from 'react';
import { getActions } from '../../store/gameStore';

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

/** Global shortcuts: Space = cultivate. (B / M arrive with Breakthrough and upgrades.) */
export function useKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isTyping(e.target) || e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        getActions().cultivate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
