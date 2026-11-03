'use client';

import { useState, type ChangeEvent } from 'react';
import {
  createProduct,
  updateProduct,
  uploadFile,
  fileUrl,
  PRODUCT_CATEGORIES,
  type Product,
  type Session,
} from '../session';
import { normalizeWebsite } from './CreateOrganigram';

const inputClass =
  'rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

/** «1 250,50» -> 125050 центів. null — якщо це не ціна. */
function parsePrice(raw: string): number | null {
  const value = raw.replace(/\s/g, '');
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) return null;

  const cents = Math.round(Number(value.replace(',', '.')) * 100);
  return cents > 0 ? cents : null;
}

export default function CreateProduct({
  session,
  onSaved,
  initial,
}: {
  session: Session | null;
  onSaved: () => void;
  /** Є лише під час редагування. */
  initial?: Product;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(
    initial ? (initial.priceCents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [category, setCategory] = useState(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initial ? fileUrl(initial.imageUrl) : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhoto(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save() {
    setError(null);

    if (!session) {
      setError('Vous devez être connecté.');
      return;
    }
    if (!title.trim()) {
      setError('Le nom du produit est requis.');
      return;
    }

    const priceCents = parsePrice(price);
    if (priceCents === null) {
      setError('Prix invalide. Exemple : 1250,50');
      return;
    }
    if (!photo && !initial) {
      setError('La photo est requise.');
      return;
    }

    setSaving(true);
    try {
      // Спершу файл, щоб отримати шлях, потім сам товар.
      const imageUrl = photo
        ? (await uploadFile(photo)).url
        : initial!.imageUrl;

      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        priceCents,
        category: category || undefined,
        imageUrl,
        url: normalizeWebsite(url),
        ownerId: session.id,
      };

      if (initial) await updateProduct(initial.id, body);
      else await createProduct(body);

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <h2 className="font-playfair text-2xl">
        {initial ? 'Modifier le produit' : 'Vendre un produit'}
      </h2>

      <div className="mt-6 flex flex-wrap gap-6">
        {/* Плашка такої самої форми, як у списку */}
        <label className="relative block aspect-square w-full max-w-64 shrink-0 cursor-pointer self-start overflow-hidden rounded-2xl border border-[rgb(128_128_128/0.3)] bg-[rgb(128_128_128/0.08)] transition-colors hover:bg-[rgb(128_128_128/0.15)]">
          {preview ? (
            // Data URL, тому звичайний img, а не next/image
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-4 text-center text-sm opacity-60">
              + Ajouter une photo
            </span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={pickPhoto}
            aria-label="Photo du produit"
            className="sr-only"
          />
        </label>

        <div className="grid min-w-64 flex-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm opacity-70">Nom du produit</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Prix (€)</span>
            <input
              inputMode="decimal"
              placeholder="1250,50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Catégorie</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm opacity-70">Description</span>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm opacity-70">
              Lien d&apos;achat (facultatif)
            </span>
            <input
              inputMode="url"
              placeholder="https://www.exemple.fr/produit"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs opacity-60">
              Sans lien, le bouton « Acheter » ouvre un e-mail vers vous.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-2 justify-self-start rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Publier'}
          </button>
        </div>
      </div>
    </section>
  );
}
