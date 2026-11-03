'use client';

import { useEffect, useState } from 'react';
import { listCompanies, fileUrl, type CompanyListItem } from '../session';

const SIZE_LABELS: Record<string, string> = {
  MICRO: 'Microentreprise (TPE)',
  SMALL: 'Petite entreprise',
  MEDIUM: 'Moyenne entreprise',
  ETI: 'Entreprise de Taille Intermédiaire',
  LARGE: 'Grande entreprise',
};

export default function BusinessPage({
  onCreate,
  onOpen,
  reloadKey,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
  reloadKey?: number;
}) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      listCompanies(search.trim() || undefined)
        .then((data) => {
          if (!cancelled) {
            setCompanies(data);
            setError(null);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, reloadKey]);

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-playfair text-2xl">Entreprises</h2>

        <button
          type="button"
          onClick={onCreate}
          className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          Créer un organigramme
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-y border-[rgb(128_128_128/0.2)] py-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise…"
          className="min-w-56 flex-1 rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2 text-sm"
        />


        <select
          defaultValue=""
          className="rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Secteur</option>
        </select>

        <select
          defaultValue=""
          className="rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Région</option>
        </select>

        <select
          defaultValue=""
          className="rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Taille</option>
        </select>

        <button
          type="button"
          onClick={() => setSearch('')}
          className="rounded-lg border border-[rgb(128_128_128/0.3)] px-4 py-2 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          Réinitialiser
        </button>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="mt-6 text-sm opacity-60">Chargement…</p>
      ) : companies.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">
          {search
            ? 'Aucune entreprise ne correspond à cette recherche.'
            : 'Aucune entreprise pour le moment.'}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {companies.map((company) => {
            const logo = fileUrl(company.logoUrl);

            return (
              <li
                key={company.id}
                className="border-b border-[rgb(128_128_128/0.15)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpen(company.id)}
                  className="flex w-full items-center gap-4 rounded-lg px-2 py-4 text-left transition-colors hover:bg-[rgb(128_128_128/0.08)]"
                >
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[rgb(128_128_128/0.15)]">
                    {logo && (
                      // Файл із бекенду, тому звичайний img
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="size-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{company.name}</span>
                    <span className="truncate text-sm opacity-60">
                      {[
                        company.size ? SIZE_LABELS[company.size] : null,
                        company.sector,
                        company.description,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm opacity-60">
                    {[
                      company._count.orgCharts > 0 ? 'Organigramme' : null,
                      company._count.offres > 0
                        ? `${company._count.offres} offre${company._count.offres > 1 ? 's' : ''}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
