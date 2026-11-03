'use client';

import { useEffect, useState } from 'react';
import {
  listProducts,
  fileUrl,
  buyHref,
  formatPrice,
  PRODUCT_CATEGORIES,
  type Product,
} from '../session';

const selectClass =
  'rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

export default function MarketPage({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      listProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        sort: sort || undefined,
      })
        .then((data) => {
          if (!cancelled) {
            setProducts(data);
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
  }, [search, category, sort]);

  function reset() {
    setSearch('');
    setCategory('');
    setSort('');
  }

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-playfair text-2xl">Market</h2>

        <button
          type="button"
          onClick={onCreate}
          className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          Vendre un produit
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-y border-[rgb(128_128_128/0.2)] py-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="min-w-56 flex-1 rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2 text-sm"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">Catégorie</option>
          {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Trier"
          className={selectClass}
        >
          <option value="">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
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
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm opacity-60">
          {search || category
            ? 'Aucun produit ne correspond à ces critères.'
            : 'Aucun produit pour le moment.'}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const image = fileUrl(product.imageUrl);
            const buy = buyHref(product);

            return (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[rgb(128_128_128/0.25)] transition-colors hover:border-[rgb(128_128_128/0.6)]"
              >
                <button
                  type="button"
                  onClick={() => onOpen(product.id)}
                  className="flex flex-1 flex-col text-left"
                >
                  {/* Товар видно повністю: contain, а не обрізка */}
                  <div className="aspect-square w-full overflow-hidden bg-[rgb(128_128_128/0.08)]">
                    {image && (
                      // Файл із бекенду, тому звичайний img
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="size-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-2 text-sm font-medium break-words">
                      {product.title}
                    </span>
                    <span className="mt-auto pt-1 text-lg font-semibold">
                      {formatPrice(product.priceCents)}
                    </span>
                  </div>
                </button>

                <a
                  href={buy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-3 mb-3 rounded-full bg-[#ff6600] px-4 py-2 text-center text-sm font-medium text-black transition-opacity hover:opacity-85"
                >
                  Acheter
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
