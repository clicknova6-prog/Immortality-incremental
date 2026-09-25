import { useState } from 'react';
import { hardReset, saveNow } from '../../core/engine';
import type { Notation } from '../../core/format';
import { exportSave, importSave } from '../../core/save';
import { useActions, useGameStore } from '../../store/gameStore';
import { Modal } from '../common/Modal';

const AUTOSAVE_OPTIONS = [5, 15, 30, 60, 120];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export function SettingsPanel() {
  const settings = useGameStore((s) => s.game.settings);
  const { setSetting, loadState, log } = useActions();
  const [exported, setExported] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const doExport = (): void => {
    const str = exportSave(useGameStore.getState().game);
    setExported(str);
    void navigator.clipboard?.writeText(str).then(
      () => log('Save copied to clipboard.'),
      () => undefined,
    );
  };

  const doImport = (): void => {
    try {
      const state = importSave(importText);
      loadState(state);
      saveNow();
      setImportText('');
      setImportError(null);
      log('Save imported.');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed');
    }
  };

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="panel divide-y divide-ink-700 px-4">
        <Row label="Number notation">
          <select
            className="rounded bg-ink-800 px-2 py-1"
            value={settings.notation}
            onChange={(e) => setSetting('notation', e.target.value as Notation)}
          >
            <option value="standard">Standard (1.23M)</option>
            <option value="scientific">Scientific (1.23e6)</option>
          </select>
        </Row>
        <Row label="Animations">
          <input
            type="checkbox"
            className="h-4 w-4 accent-jade-500"
            checked={settings.animations}
            onChange={(e) => setSetting('animations', e.target.checked)}
          />
        </Row>
        <Row label="Background particles">
          <input
            type="checkbox"
            className="h-4 w-4 accent-jade-500"
            checked={settings.particles}
            onChange={(e) => setSetting('particles', e.target.checked)}
          />
        </Row>
        <Row label="Autosave interval">
          <select
            className="rounded bg-ink-800 px-2 py-1"
            value={settings.autosaveSeconds}
            onChange={(e) => setSetting('autosaveSeconds', Number(e.target.value))}
          >
            {AUTOSAVE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}s
              </option>
            ))}
          </select>
        </Row>
      </div>

      <div className="panel space-y-3 p-4">
        <h2 className="font-display text-gold-300">Save data</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-jade"
            onClick={() => {
              saveNow();
              log('Game saved.');
            }}
          >
            Save now
          </button>
          <button type="button" className="btn" onClick={doExport}>
            Export
          </button>
        </div>
        {exported && (
          <textarea
            readOnly
            aria-label="Exported save"
            className="h-20 w-full rounded bg-ink-800 p-2 font-mono text-xs"
            value={exported}
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
        <textarea
          aria-label="Save to import"
          placeholder="Paste a save string to import…"
          className="h-20 w-full rounded bg-ink-800 p-2 font-mono text-xs"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        {importError && <p className="text-sm text-red-400">{importError}</p>}
        <button type="button" className="btn" disabled={!importText.trim()} onClick={doImport}>
          Import
        </button>
      </div>

      <div className="panel space-y-2 border-red-900/60 p-4">
        <h2 className="font-display text-red-400">Danger zone</h2>
        <button type="button" className="btn btn-danger" onClick={() => setResetStep(1)}>
          Hard reset
        </button>
      </div>

      <Modal open={resetStep > 0} title="Hard reset" onClose={() => setResetStep(0)}>
        <p className="mb-4 text-sm text-slate-300">
          {resetStep === 1
            ? 'This erases ALL progress permanently. Export your save first if you might want it back.'
            : 'Last chance. Your cultivation will return to dust. Are you absolutely sure?'}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => setResetStep(0)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (resetStep === 1) {
                setResetStep(2);
              } else {
                hardReset();
                setResetStep(0);
              }
            }}
          >
            {resetStep === 1 ? 'I understand, continue' : 'Erase everything'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
