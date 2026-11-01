'use client';

import { useEffect, useState } from 'react';
import {
  getCompany,
  fileUrl,
  type CompanyDetail,
  type CompanyNode,
} from '../session';
import { OrgCanvas, type Person } from '../services/CreateOrganigram';
import { offreTypeLabel } from '../services/OffreService';

const SIZE_LABELS: Record<string, string> = {
  MICRO: 'Microentreprise (TPE)',
  SMALL: 'Petite entreprise',
  MEDIUM: 'Moyenne entreprise',
  ETI: 'Entreprise de Taille Intermédiaire',
  LARGE: 'Grande entreprise',
};

/** Полотно чекає Person — у вузлів з бекенду null замість порожніх рядків. */
function toPeople(nodes: CompanyNode[]): Person[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    role: node.role ?? '',
    telephone: node.telephone ?? '',
    email: node.email ?? '',
    children: toPeople(node.children),
  }));
}

function findNode(nodes: Person[], id: string): Person | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findNode(node.children, id);
    if (hit) return hit;
  }
  return null;
}

const frDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : null;

export default function CompanyPage({
  companyId,
  onBack,
  onOpenOffre,
}: {
  companyId: string;
  onBack: () => void;
  onOpenOffre: (offreId: string) => void;
}) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCompany(companyId)
      .then((data) => !cancelled && setCompany(data))
      .catch((e: Error) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [companyId]);

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

  if (!company) {
    return <p className="text-sm opacity-60">Chargement…</p>;
  }

  const logo = fileUrl(company.logoUrl);
  const people = company.orgCharts.flatMap((chart) => toPeople(chart.nodes));
  const selected = selectedId ? findNode(people, selectedId) : null;

  const facts = [
    company.size ? ['Catégorie', SIZE_LABELS[company.size]] : null,
    company.sector ? ['Secteur', company.sector] : null,
    company.region ? ['Région', company.region] : null,
    frDate(company.foundedOn) ? ['Création', frDate(company.foundedOn)] : null,
    ['Contact', company.owner.email],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="flex flex-col gap-6">
      {/* Шапка */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-5">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-[rgb(128_128_128/0.3)] bg-[rgb(128_128_128/0.08)]">
              {logo ? (
                // Файл із бекенду, тому звичайний img
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-full object-contain" />
              ) : (
                <span className="text-xs opacity-50">Logo</span>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-playfair text-3xl">{company.name}</h2>
              {company.description && (
                <p className="mt-1 max-w-2xl opacity-70">
                  {company.description}
                </p>
              )}
            </div>
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

      {/* Організограма */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Organigramme</h3>

        {people.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">
            Cette entreprise n&apos;a pas encore d&apos;organigramme.
          </p>
        ) : (
          <>
            <OrgCanvas
              people={people}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {selected ? (
              <div className="mt-4 rounded-xl border border-[rgb(128_128_128/0.25)] p-4">
                <p className="font-medium">{selected.name}</p>
                <p className="text-sm opacity-60">
                  {selected.role || 'Poste non renseigné'}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  {selected.telephone && (
                    <a
                      href={`tel:${selected.telephone}`}
                      className="underline underline-offset-4"
                    >
                      {selected.telephone}
                    </a>
                  )}
                  {selected.email && (
                    <a
                      href={`mailto:${selected.email}`}
                      className="underline underline-offset-4"
                    >
                      {selected.email}
                    </a>
                  )}
                  {!selected.telephone && !selected.email && (
                    <span className="opacity-60">Aucun contact renseigné.</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm opacity-60">
                Cliquez sur une case pour voir ses coordonnées.
              </p>
            )}
          </>
        )}
      </section>

      {/* Вакансії */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Offres</h3>

        {company.offres.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">Aucune offre publiée.</p>
        ) : (
          <ul className="mt-4 flex flex-col">
            {company.offres.map((offre) => (
              <li
                key={offre.id}
                className="border-b border-[rgb(128_128_128/0.15)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpenOffre(offre.id)}
                  className="flex w-full items-center gap-4 rounded-lg px-2 py-4 text-left transition-colors hover:bg-[rgb(128_128_128/0.08)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{offre.title}</p>
                    <p className="truncate text-sm opacity-60">
                      {[offre.metier, offre.region, offre.description]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {offre.contract && (
                      <span className="rounded-full border border-[rgb(128_128_128/0.3)] px-2.5 py-1 text-xs">
                        {offre.contract}
                      </span>
                    )}
                    <span className="rounded-full bg-[rgb(128_128_128/0.15)] px-2.5 py-1 text-xs">
                      {offreTypeLabel(offre.type)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
