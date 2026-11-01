'use client';

import { useState } from 'react';
import { SKILL_CATEGORIES, type Skill } from '../session';

/** Вибір навичок: пошук + перемикачі, згруповані за категорією. */
export default function SkillPicker({
  skills,
  selected,
  onChange,
  exclude = [],
}: {
  skills: Skill[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Навички, яких у списку взагалі не показуємо — наприклад уже знайдені в PDF. */
  exclude?: string[];
}) {
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = skills.filter(
    (skill) =>
      !exclude.includes(skill.id) &&
      (!needle || skill.label.toLowerCase().includes(needle)),
  );

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((current) => current !== id)
        : [...selected, id],
    );

  if (skills.length === 0) {
    return (
      <p className="mt-1.5 text-sm opacity-60">
        Liste des compétences indisponible.
      </p>
    );
  }

  return (
    <div className="mt-1.5 rounded-lg border border-[rgb(128_128_128/0.3)] p-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une compétence…"
        className="w-full rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-1.5 text-sm"
      />

      <div className="mt-3 flex max-h-56 flex-col gap-4 overflow-y-auto">
        {SKILL_CATEGORIES.map(({ key, label }) => {
          const group = visible.filter((skill) => skill.category === key);
          if (group.length === 0) return null;

          return (
            <div key={key}>
              <p className="text-xs opacity-50">{label}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {group.map((skill) => {
                  const on = selected.includes(skill.id);

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggle(skill.id)}
                      aria-pressed={on}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        on
                          ? 'bg-[rgb(128_128_128/0.3)] font-medium'
                          : 'border border-[rgb(128_128_128/0.3)] hover:bg-[rgb(128_128_128/0.1)]'
                      }`}
                    >
                      {skill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-sm opacity-60">Aucune compétence trouvée.</p>
        )}
      </div>

      <p className="mt-3 border-t border-[rgb(128_128_128/0.2)] pt-2 text-xs opacity-50">
        {selected.length} sélectionnée{selected.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
