import type { Skill } from './skills.types';

/**
 * Зводимо текст і синоніми до спільного вигляду: нижній регістр,
 * без діакритики, апостроф як пробіл. Так "Esprit d'analyse" з CV
 * збігається зі словниковим "esprit d analyse".
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['‘’ʼ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Межі слова через \b тут не годяться: синоніми на кшталт "c++" чи "node.js"
 * закінчуються не літерою. Тому межу описуємо явно — сусід не буква й не цифра.
 */
const toPattern = (alias: string) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegex(normalize(alias))}(?![\\p{L}\\p{N}])`,
    'u',
  );

type Compiled = { skill: Skill; patterns: RegExp[] };

// Словник за час роботи процесу не змінюється, тож регулярки будуємо раз.
const cache = new WeakMap<Skill[], Compiled[]>();

function compile(skills: Skill[]): Compiled[] {
  let compiled = cache.get(skills);

  if (!compiled) {
    compiled = skills.map((skill) => ({
      skill,
      patterns: skill.aliases.map(toPattern),
    }));
    cache.set(skills, compiled);
  }

  return compiled;
}

/** Повертає id навичок, знайдених у тексті. Порядок — як у словнику. */
export function matchSkills(text: string, skills: Skill[]): string[] {
  const haystack = normalize(text);

  return compile(skills)
    .filter(({ patterns }) =>
      patterns.some((pattern) => pattern.test(haystack)),
    )
    .map(({ skill }) => skill.id);
}
