/**
 * Порядок тут — це порядок відображення категорій на фронті,
 * тому міняти його варто свідомо.
 */
export const SKILL_CATEGORIES = [
  'technique',
  'logiciel',
  'savoir-faire',
  'savoir-etre',
  'transversale',
  'langue',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Один запис зі словника data/skills.json. */
export type Skill = {
  id: string;
  label: string;
  category: SkillCategory;
  /** Написання, за якими навичку шукаємо в тексті CV. */
  aliases: string[];
};

/** Те, що віддаємо клієнту: aliases йому не потрібні. */
export type SkillOption = Omit<Skill, 'aliases'>;
