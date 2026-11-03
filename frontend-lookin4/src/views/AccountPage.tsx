'use client';

import { useEffect, useState } from 'react';
import {
  listCompanies,
  listFormations,
  listProducts,
  deleteCompany,
  deleteFormation,
  deleteProduct,
  fileUrl,
  formatPrice,
  type CompanyListItem,
  type Formation,
  type Product,
  type Session,
} from '../session';

export type EditTarget =
  | { kind: 'company'; id: string }
  | { kind: 'formation'; formation: Formation }
  | { kind: 'product'; product: Product };

const smallButton =
  'rounded-full border border-[rgb(128_128_128/0.3)] px-3 py-1 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-50';

function Row({
  image,
  title,
  detail,
  warning,
  onEdit,
  onDelete,
}: {
  image: string | null;
  title: string;
  detail: string;
  warning: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      setBusy(false);
    }
  }

  return (
    <li className="border-b border-[rgb(128_128_128/0.15)] py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-[rgb(128_128_128/0.15)]">
          {image && (
            // Файл із бекенду, тому звичайний img
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-cover" />
          )}
        </div>

        <div className="flex min-w-40 flex-1 flex-col">
          <span className="truncate font-medium">{title}</span>
          <span className="truncate text-sm opacity-60">{detail || '—'}</span>
        </div>

        {!confirming && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onEdit} className={smallButton}>
              Modifier
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={`${smallButton} text-red-600`}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-600/10 p-3">
          <p className="min-w-40 flex-1 text-sm">{warning}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={`${smallButton} text-red-600`}
          >
            {busy ? 'Suppression…' : 'Oui, supprimer'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className={smallButton}
          >
            Annuler
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <h3 className="font-playfair text-xl">
        {title} <span className="text-sm opacity-60">({count})</span>
      </h3>

      {count === 0 ? (
        <p className="mt-4 text-sm opacity-60">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col">{children}</ul>
      )}
    </section>
  );
}

export default function AccountPage({
  session,
  onEdit,
  onOpenCv,
}: {
  session: Session;
  onEdit: (target: EditTarget) => void;
  onOpenCv: () => void;
}) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listCompanies(undefined, session.id),
      listFormations({ ownerId: session.id }),
      listProducts({ ownerId: session.id }),
    ])
      .then(([myCompanies, myFormations, myProducts]) => {
        if (cancelled) return;
        setCompanies(myCompanies);
        setFormations(myFormations);
        setProducts(myProducts);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [session.id]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-playfair text-3xl">Mon compte</h2>
            <p className="mt-1 truncate opacity-70">{session.email}</p>
          </div>

          <button
            type="button"
            onClick={onOpenCv}
            className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
          >
            Mon CV
          </button>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm opacity-60">Chargement…</p>
      ) : (
        <>
          <Section
            title="Mes entreprises"
            empty="Vous n'avez pas encore créé d'entreprise."
            count={companies.length}
          >
            {companies.map((company) => (
              <Row
                key={company.id}
                image={fileUrl(company.logoUrl)}
                title={company.name}
                detail={`${company._count.offres} offre${company._count.offres > 1 ? 's' : ''}`}
                warning="Supprimer cette entreprise, ses offres et son organigramme ?"
                onEdit={() => onEdit({ kind: 'company', id: company.id })}
                onDelete={async () => {
                  await deleteCompany(company.id, session.id);
                  setCompanies((all) => all.filter((c) => c.id !== company.id));
                }}
              />
            ))}
          </Section>

          <Section
            title="Mes formations"
            empty="Vous n'avez pas encore publié de formation."
            count={formations.length}
          >
            {formations.map((formation) => (
              <Row
                key={formation.id}
                image={fileUrl(formation.imageUrl)}
                title={formation.title}
                detail={formation.description ?? ''}
                warning="Supprimer cette formation ?"
                onEdit={() => onEdit({ kind: 'formation', formation })}
                onDelete={async () => {
                  await deleteFormation(formation.id, session.id);
                  setFormations((all) =>
                    all.filter((f) => f.id !== formation.id),
                  );
                }}
              />
            ))}
          </Section>

          <Section
            title="Mes produits"
            empty="Vous n'avez pas encore mis de produit en vente."
            count={products.length}
          >
            {products.map((product) => (
              <Row
                key={product.id}
                image={fileUrl(product.imageUrl)}
                title={product.title}
                detail={formatPrice(product.priceCents)}
                warning="Supprimer ce produit ?"
                onEdit={() => onEdit({ kind: 'product', product })}
                onDelete={async () => {
                  await deleteProduct(product.id, session.id);
                  setProducts((all) => all.filter((p) => p.id !== product.id));
                }}
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
