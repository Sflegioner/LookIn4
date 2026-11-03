'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import {
  createFormation,
  updateFormation,
  listSkills,
  uploadFile,
  fileUrl,
  type Formation,
  type Session,
  type Skill,
} from '../session';
import { normalizeWebsite } from './CreateOrganigram';
import SkillPicker from './SkillPicker';

const inputClass =
  'rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

export default function CreateFormation({
  session,
  onSaved,
  initial,
}: {
  session: Session | null;
  onSaved: () => void;
  /** Є лише під час редагування. */
  initial?: Formation;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initial?.skills ?? [],
  );
  const [skills, setSkills] = useState<Skill[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initial ? fileUrl(initial.imageUrl) : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSkills()
      .then(setSkills)
      .catch(() => {});
  }, []);

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
      setError('Le titre de la formation est requis.');
      return;
    }
    if (!photo && !initial) {
      setError('La photo est requise.');
      return;
    }

    setSaving(true);
    try {
      // Спершу файл, щоб отримати шлях, потім сама формація.
      const imageUrl = photo
        ? (await uploadFile(photo)).url
        : initial!.imageUrl;

      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl,
        url: normalizeWebsite(url),
        skills: selectedSkills,
        ownerId: session.id,
      };

      if (initial) await updateFormation(initial.id, body);
      else await createFormation(body);

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
        {initial ? 'Modifier la formation' : 'Créer une promo'}
      </h2>

      <div className="mt-6 flex flex-wrap gap-6">
        {/* Плашка такої самої форми, як у списку */}
        <label className="relative block aspect-[4/2] w-full max-w-sm shrink-0 cursor-pointer self-start overflow-hidden rounded-l-2xl border border-[rgb(128_128_128/0.3)] bg-[rgb(128_128_128/0.08)] transition-colors hover:bg-[rgb(128_128_128/0.15)]">
          {preview ? (
            // Data URL, тому звичайний img, а не next/image
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="absolute inset-0 size-full object-cover"
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
            aria-label="Photo de la formation"
            className="sr-only"
          />
        </label>

        <div className="flex min-w-64 flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Titre de la formation</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Description</span>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Lien (facultatif)</span>
            <input
              inputMode="url"
              placeholder="https://www.exemple.fr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </label>

          <div>
            <span className="text-sm opacity-70">Compétences</span>
            <SkillPicker
              skills={skills}
              selected={selectedSkills}
              onChange={setSelectedSkills}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-2 self-start rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Publier'}
          </button>
        </div>
      </div>
    </section>
  );
}
