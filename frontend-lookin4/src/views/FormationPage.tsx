'use client';

import { useEffect, useState } from 'react';
import {
  getFormation,
  listSkills,
  fileUrl,
  type FormationDetail,
  type Skill,
} from '../session';

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function FormationPage({ formationId }: { formationId: string }) {
  const [formation, setFormation] = useState<FormationDetail | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFormation(formationId)
      .then((data) => !cancelled && setFormation(data))
      .catch((e: Error) => !cancelled && setError(e.message));

    // Назви навичок беремо зі словника: у формації лежать самі id.
    listSkills()
      .then((data) => !cancelled && setSkills(data))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [formationId]);

  if (error) {
    return (
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!formation) {
    return <p className="text-sm opacity-60">Chargement…</p>;
  }

  const image = fileUrl(formation.imageUrl);
  // React не блокує javascript: у href, тож показуємо лише http(s).
  const url =
    formation.url && /^https?:\/\//i.test(formation.url) ? formation.url : null;
  const taught = skills.filter((skill) => formation.skills.includes(skill.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Шапка */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="aspect-[4/2] w-full max-w-md shrink-0 overflow-hidden rounded-l-2xl bg-[rgb(128_128_128/0.15)]">
            {image && (
              // Файл із бекенду, тому звичайний img
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="size-full object-cover" />
            )}
          </div>

          <div className="min-w-64 flex-1">
            <h2 className="font-playfair text-3xl break-words">
              {formation.title}
            </h2>

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full border border-[rgb(128_128_128/0.3)] px-4 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
              >
                Visiter le site
              </a>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-[rgb(128_128_128/0.2)] pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col">
            <dt className="text-sm opacity-60">Publiée le</dt>
            <dd>{frDate(formation.createdAt)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-sm opacity-60">Contact</dt>
            <dd className="truncate">{formation.owner.email}</dd>
          </div>
        </dl>
      </section>

      {/* Опис */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Description</h3>

        {formation.description ? (
          // Переноси рядків із форми зберігаємо як є.
          <p className="mt-4 break-words whitespace-pre-line opacity-80">
            {formation.description}
          </p>
        ) : (
          <p className="mt-6 text-sm opacity-60">
            Aucune description pour cette formation.
          </p>
        )}
      </section>

      {/* Навички */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Compétences</h3>

        {taught.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">
            Aucune compétence précisée pour cette formation.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {taught.map((skill) => (
              <li
                key={skill.id}
                className="rounded-full bg-[rgb(128_128_128/0.15)] px-3 py-1 text-sm"
              >
                {skill.label}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
