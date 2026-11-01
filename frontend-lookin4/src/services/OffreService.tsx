'use client';

import { useEffect, useState } from 'react';
import { listSkills, type Skill } from '../session';
import SkillPicker from './SkillPicker';

export enum OffreType {
  EMPLOI = 'Emploi',
  SERVICE = 'Service',
  PARTENARIAT = 'Partenariat',
  APPEL_OFFRE = "Appel d'offres",
}

export type Offre = {
  id: string;
  title: string;
  description: string;
  type: OffreType;
  /** id навичок зі словника бекенду */
  skills: string[];
};

export const emptyOffre = (): Offre => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  type: OffreType.EMPLOI,
  skills: [],
});

/** Ключ enum для бекенду: 'Emploi' -> 'EMPLOI'. */
export function offreTypeKey(value: OffreType): string {
  const hit = Object.entries(OffreType).find(([, v]) => v === value);
  return hit?.[0] ?? 'EMPLOI';
}

/** Зворотний бік: 'EMPLOI' -> 'Emploi'. */
export const offreTypeLabel = (key: string): string =>
  (OffreType as Record<string, string>)[key] ?? key;

const inputClass =
  'w-full rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

type Props = {
  offres: Offre[];
  onChange: (offres: Offre[]) => void;
};

export default function OffreService({ offres, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Словник один на всі пропозиції — тягнемо його тут, а не в кожному пікері.
  useEffect(() => {
    listSkills()
      .then(setSkills)
      .catch(() => {});
  }, []);

  function add() {
    const offre = emptyOffre();
    onChange([...offres, offre]);
    setOpenId(offre.id);
  }

  const patch = (id: string, data: Partial<Offre>) =>
    onChange(offres.map((o) => (o.id === id ? { ...o, ...data } : o)));

  function remove(id: string) {
    onChange(offres.filter((o) => o.id !== id));
    if (openId === id) setOpenId(null);
  }

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-playfair text-xl">Offres</h3>

        <button
          type="button"
          onClick={add}
          className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          + Offre
        </button>
      </div>

      {offres.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">
          Aucune offre. Ajoutez une offre d&apos;emploi, un service ou un
          partenariat.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {offres.map((offre) => {
            const open = openId === offre.id;

            return (
              <li
                key={offre.id}
                className="rounded-xl border border-[rgb(128_128_128/0.25)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : offre.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="shrink-0 rounded-full bg-[rgb(128_128_128/0.15)] px-2.5 py-1 text-xs">
                    {offre.type}
                  </span>

                  <span className="min-w-0 flex-1 truncate font-medium">
                    {offre.title || 'Nouvelle offre'}
                  </span>

                  <span className="shrink-0 text-sm opacity-50">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-[rgb(128_128_128/0.2)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm opacity-70">Titre</span>
                        <input
                          value={offre.title}
                          onChange={(e) =>
                            patch(offre.id, { title: e.target.value })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm opacity-70">Type</span>
                        <select
                          value={offre.type}
                          onChange={(e) =>
                            patch(offre.id, {
                              type: e.target.value as OffreType,
                            })
                          }
                          className={inputClass}
                        >
                          {Object.values(OffreType).map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm opacity-70">Description</span>
                        <textarea
                          rows={3}
                          value={offre.description}
                          onChange={(e) =>
                            patch(offre.id, { description: e.target.value })
                          }
                          className={`${inputClass} resize-y`}
                        />
                      </label>

                      <div className="sm:col-span-2">
                        <span className="text-sm opacity-70">
                          Compétences recherchées
                        </span>
                        <SkillPicker
                          skills={skills}
                          selected={offre.skills}
                          onChange={(ids) => patch(offre.id, { skills: ids })}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(offre.id)}
                      className="mt-4 rounded-lg border border-[rgb(128_128_128/0.3)] px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-600/10"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
