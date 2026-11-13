import type { NameEntry } from '@/core';

/*
 * Export de la liste affichée. Générique : les colonnes viennent des champs calculés et des
 * faits réellement présents, quelle que soit la source.
 */

const BOM = '﻿';
const SEPARATOR = ';';

type Scalar = string | number | boolean;
const isScalar = (value: unknown): value is Scalar =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

/** Valeurs simples d'un prénom, à plat : derived.<champ> et <source>.<fait>. */
function flatten(entry: NameEntry): Record<string, Scalar> {
  const row: Record<string, Scalar> = {};
  for (const [key, value] of Object.entries(entry.derived)) {
    if (isScalar(value)) row[`derived.${key}`] = value;
  }
  for (const [sourceId, facts] of Object.entries(entry.facts)) {
    if (!facts || typeof facts !== 'object') continue;
    for (const [key, value] of Object.entries(facts)) {
      if (isScalar(value)) row[`${sourceId}.${key}`] = value;
    }
  }
  return row;
}

function cell(value: Scalar | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'oui' : 'non';
  // Excel en français attend une virgule décimale.
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(4))).replace('.', ',');
  }
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * CSV pour Excel : UTF-8 avec BOM, séparateur « ; », fins de ligne CRLF.
 * Colonnes : id, prénom, puis les champs calculés et les faits simples de chaque source.
 * Les séries annuelles (tableaux) n'y figurent pas : elles sont dans l'export JSON.
 */
export function toCsv(entries: readonly NameEntry[]): string {
  const rows = entries.map(flatten);
  const columns = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
  const header = ['id', 'prenom', ...columns];
  const lines = [header.join(SEPARATOR)];
  entries.forEach((entry, index) => {
    const row = rows[index]!;
    lines.push(
      [cell(entry.id), cell(entry.label), ...[...columns].map((key) => cell(row[key]))].join(
        SEPARATOR,
      ),
    );
  });
  return BOM + lines.join('\r\n') + '\r\n';
}

/** JSON complet : champs calculés et tous les faits de chaque source, séries comprises. */
export function toJson(entries: readonly NameEntry[]): string {
  return JSON.stringify(
    entries.map((entry) => ({
      id: entry.id,
      prenom: entry.label,
      derived: entry.derived,
      facts: entry.facts,
    })),
  );
}

/** Nom de fichier daté : prenoms-2026-11-13.csv */
export function exportFileName(extension: 'csv' | 'json', date = new Date()): string {
  return `prenoms-${date.toISOString().slice(0, 10)}.${extension}`;
}

/** Déclenche le téléchargement d'un texte sous forme de fichier. */
export function downloadText(content: string, fileName: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
