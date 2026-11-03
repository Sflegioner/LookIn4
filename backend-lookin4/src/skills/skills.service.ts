import { Injectable } from '@nestjs/common';
import { loadSkills } from './skills.data';
import { parseCvBuffer } from './cv-parser';
import type { Skill, SkillOption } from './skills.types';

@Injectable()
export class SkillsService {
  // Словник читаємо один раз на старті: файл статичний.
  private readonly skills: Skill[] = loadSkills();

  /** Для випадаючих списків на фронті — без синонімів. */
  all(): SkillOption[] {
    return this.skills.map(({ id, label, category }) => ({
      id,
      label,
      category,
    }));
  }

  /** Відкидає id, яких у словнику немає, і прибирає повтори. */
  keepKnown(ids: string[]): string[] {
    const known = new Set(this.skills.map((skill) => skill.id));

    return [...new Set(ids)].filter((id) => known.has(id));
  }

  /** Навички з PDF-резюме. */
  parseCv(data: Buffer) {
    return parseCvBuffer(data, this.skills);
  }
}
