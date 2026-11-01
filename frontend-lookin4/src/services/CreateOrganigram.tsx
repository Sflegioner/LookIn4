'use client';

import { useState, type ChangeEvent } from 'react';
import {
  createCompany,
  uploadFile,
  type NewOrgNode,
  type Session,
} from '../session';
import OffreService, { offreTypeKey, type Offre } from './OffreService';

export enum CompanyCategoryFR {
  MICRO = 'Microentreprise (TPE)',
  SMALL = 'Petite entreprise',
  MEDIUM = 'Moyenne entreprise',
  ETI = 'Entreprise de Taille Intermédiaire',
  LARGE = 'Grande entreprise',
}

export type Person = {
  id: string;
  name: string;
  role: string;
  telephone: string;
  email: string;
  children: Person[];
};

export type Entreprise = {
  logo: string | null;
  name: string;
  description: string;
  dateOfCreation: string;
  category: CompanyCategoryFR | '';
};

const EMPTY_COMPANY: Entreprise = {
  logo: null,
  name: '',
  description: '',
  dateOfCreation: '',
  category: '',
};

const emptyPerson = (): Person => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
  telephone: '',
  email: '',
  children: [],
});

// ---------- операції над деревом ----------
// Дерево перебудовується копіюванням, а не мутацією — інакше React
// не побачить зміну і не перемалює.

function insertChild(nodes: Person[], parentId: string, child: Person): Person[] {
  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: [...node.children, child] }
      : { ...node, children: insertChild(node.children, parentId, child) },
  );
}

function patchNode(
  nodes: Person[],
  id: string,
  patch: Partial<Person>,
): Person[] {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, ...patch }
      : { ...node, children: patchNode(node.children, id, patch) },
  );
}

function dropNode(nodes: Person[], id: string): Person[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: dropNode(node.children, id) }));
}

function findNode(nodes: Person[], id: string): Person | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findNode(node.children, id);
    if (hit) return hit;
  }
  return null;
}

// ---------- розкладка полотна ----------

const NODE_W = 190;
const NODE_H = 74;
const GAP_X = 28;
const GAP_Y = 62;
const PAD = 24;

type Placed = { person: Person; x: number; y: number };
type Edge = { id: string; from: Placed; to: Placed };

/** Ширина, яку займе піддерево цього вузла. */
function subtreeWidth(person: Person): number {
  if (person.children.length === 0) return NODE_W;

  const kids = person.children.reduce(
    (sum, child) => sum + subtreeWidth(child),
    0,
  );
  const gaps = GAP_X * (person.children.length - 1);
  return Math.max(NODE_W, kids + gaps);
}

/**
 * Розставляє вузли: кожен батько центрується над своїми дітьми,
 * рівень задає вертикаль. Класична розкладка організограми.
 */
function layout(people: Person[]) {
  const placed: Placed[] = [];
  const edges: Edge[] = [];

  function walk(person: Person, left: number, depth: number): Placed {
    const width = subtreeWidth(person);
    const node: Placed = {
      person,
      x: left + width / 2 - NODE_W / 2,
      y: PAD + depth * (NODE_H + GAP_Y),
    };
    placed.push(node);

    const childrenWidth =
      person.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
      GAP_X * Math.max(0, person.children.length - 1);

    let cursor = left + (width - childrenWidth) / 2;
    for (const child of person.children) {
      const childNode = walk(child, cursor, depth + 1);
      edges.push({ id: `${person.id}-${child.id}`, from: node, to: childNode });
      cursor += subtreeWidth(child) + GAP_X;
    }

    return node;
  }

  let cursor = PAD;
  for (const person of people) {
    walk(person, cursor, 0);
    cursor += subtreeWidth(person) + GAP_X;
  }

  const width = Math.max(cursor - GAP_X + PAD, 320);
  const height =
    placed.reduce((max, n) => Math.max(max, n.y + NODE_H), 0) + PAD;

  return { placed, edges, width, height };
}

/** Ортогональний шлях: вниз від батька, вбік, вниз до дитини. */
function edgePath(from: Placed, to: Placed) {
  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y;
  const midY = y1 + GAP_Y / 2;

  return `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
}

// ---------- полотно ----------

type CanvasProps = {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function OrgCanvas({ people, selectedId, onSelect }: CanvasProps) {
  const { placed, edges, width, height } = layout(people);

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-[rgb(128_128_128/0.2)] bg-[rgb(128_128_128/0.04)]">
      <div className="relative" style={{ width, height }}>
        {/* Стрілки під картками */}
        <svg
          width={width}
          height={height}
          className="absolute inset-0 text-[rgb(128_128_128/0.7)]"
          aria-hidden
        >
          <defs>
            <marker
              id="org-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {edges.map((edge) => (
            <path
              key={edge.id}
              d={edgePath(edge.from, edge.to)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              markerEnd="url(#org-arrow)"
            />
          ))}
        </svg>

        {/* Картки */}
        {placed.map(({ person, x, y }) => {
          const active = person.id === selectedId;

          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person.id)}
              style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
              className={`absolute flex items-center gap-2.5 rounded-xl border px-3 text-left transition-colors ${
                active
                  ? 'border-current bg-background'
                  : 'border-[rgb(128_128_128/0.35)] bg-background hover:bg-[rgb(128_128_128/0.08)]'
              }`}
            >
              <span className="size-8 shrink-0 rounded-full bg-[rgb(128_128_128/0.18)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {person.name || 'Sans nom'}
                </span>
                <span className="block truncate text-xs opacity-60">
                  {person.role || 'Poste non renseigné'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- панель деталей ----------

const inputClass =
  'w-full rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-3 py-2 text-sm';

type DetailsProps = {
  person: Person;
  onPatch: (id: string, patch: Partial<Person>) => void;
  onAddChild: (parentId: string) => void;
  onRemove: (id: string) => void;
};

function PersonDetails({
  person,
  onPatch,
  onAddChild,
  onRemove,
}: DetailsProps) {
  return (
    <div className="mt-4 rounded-xl border border-[rgb(128_128_128/0.25)] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Nom</span>
          <input
            value={person.name}
            onChange={(e) => onPatch(person.id, { name: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Poste</span>
          <input
            value={person.role}
            onChange={(e) => onPatch(person.id, { role: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Téléphone</span>
          <input
            type="tel"
            value={person.telephone}
            onChange={(e) => onPatch(person.id, { telephone: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Email</span>
          <input
            type="email"
            value={person.email}
            onChange={(e) => onPatch(person.id, { email: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAddChild(person.id)}
          className="rounded-lg border border-[rgb(128_128_128/0.3)] px-3 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
        >
          + Subordonné
        </button>

        <button
          type="button"
          onClick={() => onRemove(person.id)}
          className="rounded-lg border border-[rgb(128_128_128/0.3)] px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-600/10"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ---------- сторінка ----------

/** Ключі CompanyCategoryFR — саме їх чекає enum CompanySize на бекенді. */
function categoryKey(value: CompanyCategoryFR | ''): string | undefined {
  const hit = Object.entries(CompanyCategoryFR).find(([, v]) => v === value);
  return hit?.[0];
}

/** Прибирає id та порожні поля — бекенд їх не приймає. */
function toPayload(people: Person[]): NewOrgNode[] {
  return people
    .filter((p) => p.name.trim())
    .map((p) => ({
      name: p.name.trim(),
      role: p.role.trim() || undefined,
      telephone: p.telephone.trim() || undefined,
      email: p.email.trim() || undefined,
      children: p.children.length ? toPayload(p.children) : undefined,
    }));
}

export default function CreateOrganigramPage({
  session,
  onCancel,
  onSaved,
}: {
  session: Session | null;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [company, setCompany] = useState<Entreprise>(EMPTY_COMPANY);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = selectedId ? findNode(people, selectedId) : null;

  function pickLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Файл тримаємо окремо — на бекенд піде він, а не base64.
    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = () =>
      setCompany((c) => ({ ...c, logo: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save() {
    setError(null);

    if (!session) {
      setError('Vous devez être connecté.');
      return;
    }
    if (!company.name.trim()) {
      setError("Le nom de l'entreprise est requis.");
      return;
    }

    setSaving(true);
    try {
      // Спершу файл, щоб отримати шлях, потім сама компанія.
      const logoUrl = logoFile ? (await uploadFile(logoFile)).url : undefined;

      await createCompany({
        name: company.name.trim(),
        description: company.description.trim() || undefined,
        size: categoryKey(company.category),
        foundedOn: company.dateOfCreation || undefined,
        logoUrl,
        ownerId: session.id,
        nodes: toPayload(people),
        offres: offres
          .filter((o) => o.title.trim())
          .map((o) => ({
            title: o.title.trim(),
            description: o.description.trim() || undefined,
            type: offreTypeKey(o.type),
            skills: o.skills,
          })),
      });

      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSaving(false);
    }
  }

  function addRoot() {
    const person = emptyPerson();
    setPeople((p) => [...p, person]);
    setSelectedId(person.id);
  }

  function addChild(parentId: string) {
    const child = emptyPerson();
    setPeople((p) => insertChild(p, parentId, child));
    setSelectedId(child.id);
  }

  const patch = (id: string, data: Partial<Person>) =>
    setPeople((p) => patchNode(p, id, data));

  function remove(id: string) {
    setPeople((p) => dropNode(p, id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Основний блок — компанія */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-playfair text-2xl">Créer un organigramme</h2>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Retour
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-6">
          {/* Лого */}
          <div className="flex flex-col items-center gap-2">
            <div className="grid size-28 place-items-center overflow-hidden rounded-xl border border-[rgb(128_128_128/0.3)] bg-[rgb(128_128_128/0.08)]">
              {company.logo ? (
                // Data URL, тому звичайний img, а не next/image
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo}
                  alt=""
                  className="size-full object-contain"
                />
              ) : (
                <span className="text-xs opacity-50">Logo</span>
              )}
            </div>

            <label className="cursor-pointer rounded-lg border border-[rgb(128_128_128/0.3)] px-3 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]">
              Choisir
              <input
                type="file"
                accept="image/*"
                onChange={pickLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Поля компанії */}
          <div className="grid min-w-64 flex-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm opacity-70">Nom de l&apos;entreprise</span>
              <input
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm opacity-70">Date de création</span>
              <input
                type="date"
                value={company.dateOfCreation}
                onChange={(e) =>
                  setCompany({ ...company, dateOfCreation: e.target.value })
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm opacity-70">Catégorie</span>
              <select
                value={company.category}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    category: e.target.value as CompanyCategoryFR | '',
                  })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {Object.values(CompanyCategoryFR).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm opacity-70">Description</span>
              <textarea
                rows={3}
                value={company.description}
                onChange={(e) =>
                  setCompany({ ...company, description: e.target.value })
                }
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Полотно */}
      <section className="rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-playfair text-xl">Organigramme</h3>

          <button
            type="button"
            onClick={addRoot}
            className="rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)]"
          >
            + Personne
          </button>
        </div>

        {people.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">
            Aucune personne. Commencez par ajouter la direction.
          </p>
        ) : (
          <>
            <OrgCanvas
              people={people}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {selected ? (
              <PersonDetails
                person={selected}
                onPatch={patch}
                onAddChild={addChild}
                onRemove={remove}
              />
            ) : (
              <p className="mt-4 text-sm opacity-60">
                Cliquez sur une case pour modifier ses informations.
              </p>
            )}
          </>
        )}
      </section>

      {/* Пропозиції компанії */}
      <OffreService offres={offres} onChange={setOffres} />

      <div className="flex flex-wrap items-center justify-end gap-4">
        {error && <p className="flex-1 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full border border-[rgb(128_128_128/0.35)] px-6 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
