'use client';

import { useEffect, useState } from 'react';
import {
  getOffre,
  listSkills,
  getMyCv,
  fileUrl,
  type OffreDetail,
  type Session,
  type Skill,
} from '../session';
import { offreTypeLabel } from '../services/OffreService';

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function OffrePage({
  offreId,
  onBack,
  onOpenCompany,
  session,
}: {
  offreId: string;
  onBack: () => void;
  onOpenCompany: (companyId: string) => void;
  session: Session | null;
}) {
  const [offre, setOffre] = useState<OffreDetail | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getOffre(offreId)
      .then((data) => !cancelled && setOffre(data))
      .catch((e: Error) => !cancelled && setError(e.message));

    // Назви навичок беремо зі словника: в offre лежать самі id.
    listSkills()
      .then((data) => !cancelled && setSkills(data))
      .catch(() => {});

    // Свої навички — щоб підсвітити збіги. Незалогінений просто їх не побачить.
    if (session) {
      getMyCv(session.id)
        .then((cv) => {
          if (cancelled || !cv) return;
          const content = cv.content;
          setMySkills([...(content?.skills ?? []), ...(content?.manual ?? [])]);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [offreId, session]);

  if (error) {
    return (
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-sm underline underline-offset-4 opacity-70"
        >
          Retour
        </button>
      </section>
    );
  }

  if (!offre) {
    return <p className="text-sm opacity-60">Chargement…</p>;
  }

  const logo = fileUrl(offre.company.logoUrl);
  const required = skills.filter((skill) => offre.skills.includes(skill.id));
  const common = required.filter((skill) => mySkills.includes(skill.id)).length;

  const facts = [
    ['Type', offreTypeLabel(offre.type)],
    offre.contract ? ['Contrat', offre.contract] : null,
    offre.metier ? ['Métier', offre.metier] : null,
    offre.region ? ['Région', offre.region] : null,
    ['Publiée le', frDate(offre.createdAt)],
    ['Contact', offre.company.owner.email],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="flex flex-col gap-6">
      {/* Шапка */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-playfair text-3xl">{offre.title}</h2>
            <p className="mt-1 opacity-70">{offre.company.name}</p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-sm opacity-70 transition-opacity hover:opacity-100"
          >
            Retour
          </button>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-[rgb(128_128_128/0.2)] pt-5 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-sm opacity-60">{label}</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Опис */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Description</h3>

        {offre.description ? (
          // Переноси рядків із форми зберігаємо як є.
          <p className="mt-4 whitespace-pre-line opacity-80">
            {offre.description}
          </p>
        ) : (
          <p className="mt-6 text-sm opacity-60">
            Aucune description pour cette offre.
          </p>
        )}
      </section>

      {/* Потрібні навички: зелені — ті, що вже є в моєму CV */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-playfair text-xl">Compétences recherchées</h3>

          {required.length > 0 && mySkills.length > 0 && (
            <span
              className={
                common > 0 ? 'text-sm text-green-700 dark:text-green-400' : 'text-sm opacity-60'
              }
            >
              {common} sur {required.length} dans votre CV
            </span>
          )}
        </div>

        {required.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">
            Aucune compétence précisée pour cette offre.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {required.map((skill) => {
              const mine = mySkills.includes(skill.id);

              return (
                <li
                  key={skill.id}
                  className={`rounded-full px-3 py-1 text-sm ${
                    mine
                      ? 'bg-green-600/15 font-medium text-green-700 dark:text-green-400'
                      : 'bg-[rgb(128_128_128/0.15)]'
                  }`}
                >
                  {skill.label}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Компанія */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Entreprise</h3>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[rgb(128_128_128/0.3)] bg-[rgb(128_128_128/0.08)]">
            {logo ? (
              // Файл із бекенду, тому звичайний img
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-full object-contain" />
            ) : (
              <span className="text-xs opacity-50">Logo</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{offre.company.name}</p>
            <p className="truncate text-sm opacity-60">
              {[
                offre.company.sector,
                offre.company.region,
                offre.company.description,
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCompany(offre.company.id)}
            className="shrink-0 rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
          >
            Voir l&apos;entreprise
          </button>
        </div>
      </section>
    </div>
  );
}
