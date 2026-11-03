'use client';

import { useEffect, useState } from 'react';
import {
  listFormations,
  listSkills,
  fileUrl,
  SKILL_CATEGORIES,
  type Formation,
  type Skill,
} from '../session';

const selectClass =
  'rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

export default function LearnPage({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Словник (data/skills.json) не змінюється — тягнемо один раз.
  useEffect(() => {
    listSkills()
      .then(setSkills)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      listFormations({
        search: search.trim() || undefined,
        category: category || undefined,
        skill: skill || undefined,
      })
        .then((data) => {
          if (!cancelled) {
            setFormations(data);
            setError(null);
          }
        })
        .catch((e: Error) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category, skill]);

  function reset() {
    setSearch('');
    setCategory('');
    setSkill('');
  }

  const filtering = Boolean(search || category || skill);
  const skillOptions = category
    ? skills.filter((s) => s.category === category)
    : skills;

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-playfair text-2xl">Formations</h2>

        <button
          type="button"
          onClick={onCreate}
          className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          Créer une promo
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-y border-[rgb(128_128_128/0.2)] py-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une formation…"
          className="min-w-56 flex-1 rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2 text-sm"
        />

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            // Обрана навичка могла лишитися з іншої категорії.
            setSkill('');
          }}
          className={selectClass}
        >
          <option value="">Catégorie</option>
          {SKILL_CATEGORIES.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className={`${selectClass} max-w-52`}
        >
          <option value="">Compétence</option>
          {skillOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[rgb(128_128_128/0.3)] px-4 py-2 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          Réinitialiser
        </button>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="mt-6 text-sm opacity-60">Chargement…</p>
      ) : formations.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">
          {filtering
            ? 'Aucune formation ne correspond à ces critères.'
            : 'Aucune formation pour le moment.'}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {formations.map((formation) => {
            const image = fileUrl(formation.imageUrl);
            const count = formation.skills.length;

            return (
              <li
                key={formation.id}
                className="border-b border-[rgb(128_128_128/0.15)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpen(formation.id)}
                  className="flex w-full items-center gap-4 rounded-lg px-2 py-4 text-left transition-colors hover:bg-[rgb(128_128_128/0.08)]"
                >
                  {/* Плашка 4:2, заокруглена з початку рядка */}
                  <div className="aspect-[4/2] w-28 shrink-0 overflow-hidden rounded-l-2xl bg-[rgb(128_128_128/0.15)] sm:w-40">
                    {image && (
                      // Файл із бекенду, тому звичайний img
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {formation.title}
                    </span>
                    <span className="truncate text-sm opacity-60">
                      {formation.description || '—'}
                    </span>
                  </div>

                  {count > 0 && (
                    <span className="hidden shrink-0 text-sm opacity-60 sm:block">
                      {count} compétence{count > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
