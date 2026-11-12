/**
 * Vérifie que la somme des effectifs de public/data/insee.json correspond à celle du CSV.
 * Usage : npm run validate:data [-- chemin/vers/fichier.csv]
 */
import { readFileSync } from 'node:fs';
import type { InseeData } from '../src/sources/insee/format.ts';
import { findInseeCsv, formatInt, OUT_JSON } from './lib/files.ts';
import { validateInseeData } from './lib/insee.ts';

const csvPath = findInseeCsv(process.argv[2]);
const data = JSON.parse(readFileSync(OUT_JSON, 'utf8')) as InseeData;
const errors = validateInseeData(readFileSync(csvPath, 'utf8'), data);

if (errors.length > 0) {
  console.error(`${OUT_JSON} ne correspond pas à ${csvPath} :\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(
  `OK : ${formatInt(data.meta.totalBirths)} naissances et ${formatInt(data.meta.nameCount)} prénoms, ` +
    `sommes identiques entre ${csvPath} (hors exclusions) et ${OUT_JSON}.`,
);
