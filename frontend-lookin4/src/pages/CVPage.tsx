'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  getMyCv,
  createCv,
  updateCv,
  deleteCv,
  uploadFile,
  listSkills,
  fileUrl as toFileUrl,
  SKILL_CATEGORIES,
  type CvDetail,
  type Skill,
} from '../session';
import SkillPicker from '../services/SkillPicker';

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function CVPage({
  session,
}: {
  session: { id: string; email: string };
}) {
  const [cv, setCv] = useState<CvDetail | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getMyCv(session.id), listSkills()])
      .then(([mine, dictionary]) => {
        if (cancelled) return;
        setCv(mine);
        setSkills(dictionary);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [session.id]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;

    setBusy(true);
    try {
      setCv(await createCv(title.trim(), session.id));
      setTitle('');
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pickPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Той самий input перевикористовуємо, тож значення скидаємо одразу:
    // інакше повторний вибір того самого файлу не дасть події.
    event.target.value = '';
    if (!file || !cv) return;

    setBusy(true);
    try {
      // Спершу файл, потім привʼязка до CV — на ній бекенд і розбирає PDF.
      const { url } = await uploadFile(file);
      setCv(await updateCv(cv.id, { fileUrl: url }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Ручний список зберігаємо цілком — бекенд замінює його, а не доповнює. */
  async function saveManual(ids: string[]) {
    if (!cv) return;

    setBusy(true);
    try {
      setCv(await updateCv(cv.id, { manualSkills: ids }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!cv) return;

    setBusy(true);
    try {
      await deleteCv(cv.id);
      // CV один: після видалення лишаємось тут і показуємо форму створення.
      setCv(null);
      setConfirming(false);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm opacity-60">Chargement…</p>;

  // ---------- CV ще немає ----------

  if (!cv) {
    return (
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h2 className="font-playfair text-2xl">Mon CV</h2>

        <p className="mt-6 text-sm opacity-60">
          Vous n&apos;avez pas encore de CV. Donnez-lui un titre pour commencer.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <form onSubmit={create} className="mt-4 flex flex-wrap gap-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du CV — ex. Ingénieur qualité"
            maxLength={160}
            className="min-w-56 flex-1 rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={!title.trim() || busy}
            className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-40"
          >
            {busy ? 'Création…' : 'Créer mon CV'}
          </button>
        </form>
      </section>
    );
  }

  // ---------- CV є ----------

  const pdf = toFileUrl(cv.fileUrl);
  const found = cv.content?.skills ?? [];
  const manual = cv.content?.manual ?? [];
  const detected = skills.filter((skill) => found.includes(skill.id));
  const added = skills.filter((skill) => manual.includes(skill.id));
  const textLength = cv.content?.textLength ?? 0;

  const facts: [string, string][] = [
    ['Créé le', frDate(cv.createdAt)],
    ['Modifié le', frDate(cv.updatedAt)],
    ['Contact', cv.user.email],
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Шапка */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-playfair text-3xl">{cv.title}</h2>

          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy || confirming}
              className="rounded-lg border border-[rgb(128_128_128/0.3)] px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-600/10 disabled:opacity-40"
            >
              Supprimer
            </button>
          </div>
        </div>

        {confirming && (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-red-600/40 bg-red-600/5 p-4">
            <p className="flex-1 text-sm">
              Supprimer ce CV ? Cette action est définitive.
            </p>

            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-lg border border-red-600/50 px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-600/10 disabled:opacity-40"
            >
              {busy ? 'Suppression…' : 'Confirmer'}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-lg border border-[rgb(128_128_128/0.3)] px-4 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-40"
            >
              Annuler
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-[rgb(128_128_128/0.2)] pt-5 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-sm opacity-60">{label}</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* PDF */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <h3 className="font-playfair text-xl">Mon CV en PDF</h3>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {pdf ? (
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate text-sm underline underline-offset-4"
            >
              Ouvrir le PDF
            </a>
          ) : (
            <p className="flex-1 text-sm opacity-60">
              Aucun fichier. Formats acceptés : PDF, 10 Mo maximum.
            </p>
          )}

          <label
            className={`shrink-0 rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] ${
              busy ? 'pointer-events-none opacity-40' : 'cursor-pointer'
            }`}
          >
            {busy ? 'Analyse…' : pdf ? 'Remplacer' : 'Choisir un fichier'}
            <input
              type="file"
              accept="application/pdf"
              onChange={pickPdf}
              className="hidden"
            />
          </label>
        </div>

        {pdf && (
          // Висота фіксована: інакше вбудований переглядач схлопується в нуль,
          // бо object не має власних розмірів.
          <object
            data={pdf}
            type="application/pdf"
            aria-label={cv.title}
            className="mt-4 h-[720px] w-full rounded-xl border border-[rgb(128_128_128/0.25)]"
          >
            {/* Мобільні браузери PDF не вбудовують — лишається посилання */}
            <p className="p-4 text-sm opacity-60">
              Votre navigateur n&apos;affiche pas les PDF.{' '}
              <a
                href={pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Ouvrir le fichier
              </a>
            </p>
          </object>
        )}
      </section>

      {/* Compétences: знайдені парсером + додані вручну */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-playfair text-xl">Compétences</h3>

          <button
            type="button"
            onClick={() => setPicking((open) => !open)}
            disabled={busy}
            className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-40"
          >
            {picking ? 'Terminer' : '+ Ajouter des compétences'}
          </button>
        </div>

        {picking && (
          <div className="mt-4">
            <p className="text-sm opacity-60">
              Ajoutez ce que le PDF n&apos;a pas détecté. Les modifications sont
              enregistrées immédiatement.
            </p>

            <SkillPicker
              skills={skills}
              selected={manual}
              onChange={saveManual}
              // Знайдені в PDF ховаємо: їх не додають руками.
              exclude={found}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {detected.length > 0 && (
            <div>
              <p className="text-sm opacity-60">
                Détectées dans le PDF ({detected.length})
              </p>

              <div className="mt-2 flex flex-col gap-3">
                {SKILL_CATEGORIES.map(({ key, label }) => {
                  const group = detected.filter(
                    (skill) => skill.category === key,
                  );
                  if (group.length === 0) return null;

                  return (
                    <div key={key} className="flex flex-wrap items-center gap-2">
                      <span className="w-36 shrink-0 text-xs opacity-50">
                        {label}
                      </span>
                      {group.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-[rgb(128_128_128/0.15)] px-3 py-1 text-sm"
                        >
                          {skill.label}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {added.length > 0 && (
            <div>
              <p className="text-sm opacity-60">
                Ajoutées par vous ({added.length})
              </p>

              <ul className="mt-2 flex flex-wrap gap-2">
                {added.map((skill) => (
                  <li key={skill.id}>
                    <button
                      type="button"
                      onClick={() =>
                        saveManual(manual.filter((id) => id !== skill.id))
                      }
                      disabled={busy}
                      title="Retirer"
                      className="rounded-full border border-[rgb(128_128_128/0.3)] px-3 py-1 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-40"
                    >
                      {skill.label} <span className="opacity-50">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detected.length === 0 && added.length === 0 && (
            <p className="text-sm opacity-60">
              {!pdf
                ? 'Chargez votre CV en PDF : les compétences en seront extraites automatiquement. Vous pouvez aussi les ajouter à la main.'
                : textLength === 0
                  ? "Ce PDF ne contient pas de texte — c'est probablement un scan. Ajoutez vos compétences à la main."
                  : 'Aucune compétence connue trouvée dans ce PDF.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
