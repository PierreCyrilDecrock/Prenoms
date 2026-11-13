/**
 * Transforme le CSV des prénoms de l'INSEE (data/raw/) en JSON compact (public/data/insee.json).
 * Usage : npm run build:data [-- chemin/vers/fichier.csv]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { findInseeCsv, formatBytes, formatInt, OUT_JSON, OUT_REPORT } from './lib/files.ts';
import { buildInseeData, validateInseeData } from './lib/insee.ts';

const MAX_GZIP_BYTES = 3 * 1024 * 1024;

const csvPath = findInseeCsv(process.argv[2]);
const csvText = readFileSync(csvPath, 'utf8');
const { data, report } = buildInseeData(csvText, {
  sourceFile: basename(csvPath),
  generatedAt: new Date().toISOString(),
});

const errors = validateInseeData(csvText, data);
if (errors.length > 0) {
  console.error('Données incohérentes, rien n’est écrit :\n- ' + errors.join('\n- '));
  process.exit(1);
}

const json = JSON.stringify(data);
const size = { raw: Buffer.byteLength(json), gzip: gzipSync(json, { level: 9 }).length };
mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, json);
writeFileSync(OUT_REPORT, JSON.stringify({ ...report, size }, null, 2) + '\n');

const { excluded, csv, meta } = report;
const line = (label: string, value: string) => console.log(`  ${label.padEnd(34)} ${value}`);
console.log(`\nSource : ${csvPath}`);
line('Lignes du CSV', formatInt(csv.rows));
line('Naissances du CSV', formatInt(csv.births));
line('Graphies distinctes', formatInt(csv.distinctNames));
console.log('\nExclusions');
line(
  'Année inconnue (XXXX)',
  `${formatInt(excluded.unknownYear.rows)} lignes, ${formatInt(excluded.unknownYear.births)} naissances`,
);
line(
  'Prénoms rares (_PRENOMS_RARES)',
  `${formatInt(excluded.rareNames.rows)} lignes, ${formatInt(excluded.rareNames.births)} naissances`,
);
line('Lignes illisibles', formatInt(excluded.invalid.rows));
line('Prénoms sans année connue', formatInt(excluded.namesWithoutKnownYear));
console.log('\nRésultat');
line('Prénoms', formatInt(meta.nameCount));
line('Graphies fusionnées', formatInt(report.mergedVariants));
line(
  'Effectifs arrondis',
  report.countsRoundedTo ? `au multiple de ${report.countsRoundedTo}` : 'non (effectifs exacts)',
);
line('Naissances conservées', formatInt(meta.totalBirths));
line('Années', `${meta.yearMin}–${meta.yearMax}`);
line(OUT_JSON, `${formatBytes(size.raw)} brut, ${formatBytes(size.gzip)} gzip`);

if (size.gzip > MAX_GZIP_BYTES) {
  console.error(`\nLe JSON dépasse ${formatBytes(MAX_GZIP_BYTES)} en gzip : format à compacter.`);
  process.exit(1);
}
