import { useEffect, useRef, useState } from 'react';
import type { NameEntry } from '@/core';
import { downloadText, exportFileName, toCsv, toJson } from '@/state/exportData';
import { haptic } from '@/state/settingsStore';
import { useToastStore } from '@/state/toastStore';
import { plural } from '@/ui/format';
import { buttonClass } from './States';

/** Bouton « Exporter » : télécharge la liste filtrée et triée en CSV ou en JSON. */
export function ExportMenu({ results }: { results: readonly NameEntry[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && containerRef.current?.contains(event.target as Node))
        return;
      setOpen(false);
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', close);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', close);
    };
  }, [open]);

  const exportAs = (format: 'csv' | 'json') => {
    const content = format === 'csv' ? toCsv(results) : toJson(results);
    downloadText(
      content,
      exportFileName(format),
      format === 'csv' ? 'text/csv' : 'application/json',
    );
    showToast(
      `${plural(results.length, 'prénom')} exporté${results.length > 1 ? 's' : ''} en ${format.toUpperCase()}`,
    );
    haptic();
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        disabled={results.length === 0}
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
      >
        Exporter
      </button>
      {open && (
        <div
          role="group"
          aria-label="Format d’export"
          className="absolute right-0 z-10 mt-1 flex w-56 flex-col gap-1 rounded-card border border-line bg-surface-raised p-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => exportAs('csv')}
            className="min-h-11 rounded-card px-3 text-left hover:bg-surface-sunken"
          >
            CSV <span className="text-sm text-ink-muted">(Excel)</span>
          </button>
          <button
            type="button"
            onClick={() => exportAs('json')}
            className="min-h-11 rounded-card px-3 text-left hover:bg-surface-sunken"
          >
            JSON <span className="text-sm text-ink-muted">(séries annuelles comprises)</span>
          </button>
        </div>
      )}
    </div>
  );
}
