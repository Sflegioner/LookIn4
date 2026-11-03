'use client';

import { useEffect, useState } from 'react';
import {
  getProduct,
  fileUrl,
  buyHref,
  formatPrice,
  PRODUCT_CATEGORIES,
  type Product,
} from '../session';

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function ProductPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProduct(productId)
      .then((data) => !cancelled && setProduct(data))
      .catch((e: Error) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) {
    return (
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!product) {
    return <p className="text-sm opacity-60">Chargement…</p>;
  }

  const image = fileUrl(product.imageUrl);

  const facts = [
    product.category
      ? ['Catégorie', PRODUCT_CATEGORIES[product.category] ?? product.category]
      : null,
    ['Publié le', frDate(product.createdAt)],
    ['Vendeur', product.owner.email],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="aspect-square w-full max-w-sm shrink-0 overflow-hidden rounded-2xl bg-[rgb(128_128_128/0.08)]">
            {image && (
              // Файл із бекенду, тому звичайний img
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="size-full object-contain" />
            )}
          </div>

          <div className="min-w-64 flex-1">
            <h2 className="font-playfair text-3xl break-words">
              {product.title}
            </h2>

            <p className="mt-3 text-3xl font-semibold">
              {formatPrice(product.priceCents)}
            </p>

            <a
              href={buyHref(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-full bg-[#ff6600] px-8 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-85"
            >
              Acheter
            </a>

            <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-[rgb(128_128_128/0.2)] pt-5 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-sm opacity-60">{label}</dt>
                  <dd className="truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Description</h3>

        {product.description ? (
          // Переноси рядків із форми зберігаємо як є.
          <p className="mt-4 break-words whitespace-pre-line opacity-80">
            {product.description}
          </p>
        ) : (
          <p className="mt-6 text-sm opacity-60">
            Aucune description pour ce produit.
          </p>
        )}
      </section>
    </div>
  );
}
