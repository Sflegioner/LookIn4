import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Skill } from './skills.types';

/**
 * Словник лежить у data/skills.json, а не в src: так його правлять
 * без перезбирання, і той самий файл читає CLI-скрипт парсера.
 */
export const SKILLS_FILE = join(process.cwd(), 'data', 'skills.json');

export function loadSkills(file: string = SKILLS_FILE): Skill[] {
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'));

  if (!Array.isArray(raw)) {
    throw new Error(`${file}: очікувався масив навичок.`);
  }

  return raw as Skill[];
}
