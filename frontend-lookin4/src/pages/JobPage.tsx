'use client';

import { useEffect, useState } from 'react';
import {
  listOffres,
  getOffreFacets,
  getMyCv,
  fileUrl,
  type OffreItem,
  type Session,
} from '../session';
import { OffreType, offreTypeLabel } from '../services/OffreService';

const CONTRACTS = ['CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'];

const selectClass =
  'rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

export default function JobPage({
  onCreate,
  onOpen,
  session,
  onRequireAuth,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
  session: Session | null;
  onRequireAuth: () => void;
}) {
  const [offres, setOffres] = useState<OffreItem[]>([]);
  const [facets, setFacets] = useState<{ metiers: string[]; regions: string[] }>(
    { metiers: [], regions: [] },
  );
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [metier, setMetier] = useState('');
  const [region, setRegion] = useState('');
  const [contract, setContract] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mySkills, setMySkills] = useState<string[] | null>(null);
  const [comparing, setComparing] = useState(false);

  // Значення для випадаючих списків беремо з бази — один раз
  useEffect(() => {
    getOffreFacets()
      .then(setFacets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      listOffres({
        search: search.trim() || undefined,
        type: type || undefined,
        metier: metier || undefined,
        region: region || undefined,
        contract: contract || undefined,
      })
        .then((data) => {
          if (!cancelled) {
            setOffres(data);
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
  }, [search, type, metier, region, contract]);

  function reset() {
    setSearch('');
    setType('');
    setMetier('');
    setRegion('');
    setContract('');
  }

  /** Вмикає підрахунок спільних навичок із моїм CV. Повторний клік вимикає. */
  async function compare() {
    if (mySkills) {
      setMySkills(null);
      return;
    }

    if (!session) {
      onRequireAuth();
      return;
    }

    setComparing(true);
    try {
      const cv = await getMyCv(session.id);
      // Знайдені в PDF плюс додані вручну.
      setMySkills([
        ...(cv?.content?.skills ?? []),
        ...(cv?.content?.manual ?? []),
      ]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setComparing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-playfair text-2xl">Offres d&apos;emploi</h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={compare}
            disabled={comparing}
            aria-pressed={mySkills !== null}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
              mySkills !== null
                ? 'bg-[rgb(128_128_128/0.25)]'
                : 'border border-[rgb(128_128_128/0.35)] hover:bg-[rgb(128_128_128/0.1)]'
            }`}
          >
            {comparing
              ? 'Analyse…'
              : mySkills !== null
                ? 'Masquer la comparaison'
                : 'Comparer à mon CV'}
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
          >
            Mon CV
          </button>
        </div>
      </div>

      {mySkills !== null && (
        <p className="mt-4 text-sm opacity-60">
          {mySkills.length === 0
            ? "Aucune compétence dans votre CV : chargez-le en PDF pour que l'analyse fonctionne."
            : `Comparaison avec les ${mySkills.length} compétences de votre CV.`}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3 border-y border-[rgb(128_128_128/0.2)] py-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une offre…"
          className="min-w-56 flex-1 rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2 text-sm"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={selectClass}
        >
          <option value="">Type</option>
          {Object.entries(OffreType).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={metier}
          onChange={(e) => setMetier(e.target.value)}
          className={selectClass}
        >
          <option value="">Métier</option>
          {facets.metiers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={selectClass}
        >
          <option value="">Région</option>
          {facets.regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          className={selectClass}
        >
          <option value="">Contrat</option>
          {CONTRACTS.map((c) => (
            <option key={c} value={c}>
              {c}
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
      ) : offres.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">
          Aucune offre ne correspond à ces critères.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {offres.map((offre) => {
            const logo = fileUrl(offre.company.logoUrl);
            const common = mySkills
              ? offre.skills.filter((id) => mySkills.includes(id)).length
              : null;

            return (
              <li
                key={offre.id}
                className="border-b border-[rgb(128_128_128/0.15)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpen(offre.id)}
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
                    <span className="truncate font-medium">{offre.title}</span>
                    <span className="truncate text-sm opacity-60">
                      {[
                        offre.company.name,
                        offre.metier,
                        offre.region,
                        offre.description,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {common !== null && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          common > 0
                            ? 'bg-green-600/15 text-green-700 dark:text-green-400'
                            : 'opacity-50'
                        }`}
                      >
                        {common} en commun
                      </span>
                    )}

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
            );
          })}
        </ul>
      )}
    </section>
  );
}
