import { format, formatTime } from '../../core/format';
import { useActions, useGameStore } from '../../store/gameStore';
import { Modal } from '../common/Modal';

export function OfflineModal() {
  const report = useGameStore((s) => s.ui.offlineReport);
  const { dismissOfflineReport } = useActions();
  return (
    <Modal open={report !== null} title="While you were away…" onClose={dismissOfflineReport}>
      {report && (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            You meditated in seclusion for{' '}
            <span className="text-gold-300">{formatTime(report.seconds)}</span>.
            {report.capped && (
              <span className="block text-xs text-slate-500">
                (Away {formatTime(report.awaySeconds)} — seclusion is capped.)
              </span>
            )}
          </p>
          <ul className="space-y-1">
            {report.gains.length === 0 && <li className="text-slate-500">Nothing gained.</li>}
            {report.gains.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span>
                  {g.icon} {g.name}
                </span>
                <span className="text-jade-300 tabular-nums">+{format(g.gain)}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-jade w-full" onClick={dismissOfflineReport}>
            Continue cultivating
          </button>
        </div>
      )}
    </Modal>
  );
}
