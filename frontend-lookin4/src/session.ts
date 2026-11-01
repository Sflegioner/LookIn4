// Сесія поки живе в localStorage. Це тимчасово: значення доступне
// будь-якому скрипту на сторінці, тож справжню сесію згодом замінить
// httpOnly-кука з бекенду.

const KEY = 'lookin4_session';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export type Session = { id: string; email: string };

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    // Побите значення — вважаємо, що сесії нема.
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

/** Кидає Error з повідомленням від бекенду. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message;
    throw new Error(
      Array.isArray(message) ? message[0] : (message ?? 'Erreur inattendue.'),
    );
  }

  return data as T;
}

const postJson = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const login = (email: string, password: string) =>
  postJson<Session>('/auth/login', { email, password });

export const register = (email: string, password: string) =>
  postJson<Session>('/auth/register', { email, password });

// ---------- компанії ----------

export type CompanyListItem = {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  region: string | null;
  size: string | null;
  logoUrl: string | null;
  createdAt: string;
  _count: { offres: number; orgCharts: number };
};

export type NewOrgNode = {
  name: string;
  role?: string;
  telephone?: string;
  email?: string;
  children?: NewOrgNode[];
};

export type NewOffre = {
  title: string;
  description?: string;
  type?: string;
  metier?: string;
  region?: string;
  contract?: string;
  skills?: string[];
};

export type NewCompany = {
  name: string;
  description?: string;
  size?: string;
  foundedOn?: string;
  logoUrl?: string;
  ownerId: string;
  nodes?: NewOrgNode[];
  offres?: NewOffre[];
};

export type CompanyNode = {
  id: string;
  name: string;
  role: string | null;
  telephone: string | null;
  email: string | null;
  children: CompanyNode[];
};

export type CompanyDetail = {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  region: string | null;
  size: string | null;
  logoUrl: string | null;
  foundedOn: string | null;
  createdAt: string;
  owner: { email: string };
  offres: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    contract: string | null;
    metier: string | null;
    region: string | null;
  }[];
  orgCharts: { id: string; name: string; nodes: CompanyNode[] }[];
};

export const createCompany = (body: NewCompany) =>
  postJson<{ id: string; name: string }>('/companies', body);

export const getCompany = (id: string) =>
  request<CompanyDetail>(`/companies/${id}`);

// ---------- пропозиції ----------

export type OffreItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  metier: string | null;
  region: string | null;
  contract: string | null;
  skills: string[];
  createdAt: string;
  company: { id: string; name: string; logoUrl: string | null };
};

export type OffreFilters = {
  search?: string;
  type?: string;
  metier?: string;
  region?: string;
  contract?: string;
};

export function listOffres(filters: OffreFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return request<OffreItem[]>(`/offres${qs ? `?${qs}` : ''}`);
}

export type OffreDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  metier: string | null;
  region: string | null;
  contract: string | null;
  skills: string[];
  createdAt: string;
  company: {
    id: string;
    name: string;
    description: string | null;
    sector: string | null;
    region: string | null;
    size: string | null;
    logoUrl: string | null;
    owner: { email: string };
  };
};

export const getOffre = (id: string) => request<OffreDetail>(`/offres/${id}`);

export const getOffreFacets = () =>
  request<{ metiers: string[]; regions: string[] }>('/offres/facets');

// ---------- навички ----------

/**
 * Порядок = порядок відображення груп у SkillPicker і на сторінці CV.
 * Мусить збігатися зі SKILL_CATEGORIES на бекенді.
 */
export const SKILL_CATEGORIES = [
  { key: 'technique', label: 'Techniques' },
  { key: 'logiciel', label: 'Logiciels & outils' },
  { key: 'savoir-faire', label: 'Savoir-faire' },
  { key: 'savoir-etre', label: 'Savoir-être' },
  { key: 'transversale', label: 'Transversales' },
  { key: 'langue', label: 'Langues' },
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]['key'];

export type Skill = { id: string; label: string; category: SkillCategory };

export const listSkills = () => request<Skill[]>('/skills');

// ---------- CV ----------

export type CvListItem = {
  id: string;
  title: string;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Те, що парсер записав у Cv.content. */
export type CvContent = {
  /** знайдені парсером у PDF */
  skills?: string[];
  /** додані вручну */
  manual?: string[];
  textLength?: number;
  parsedAt?: string | null;
};

export type CvDetail = CvListItem & {
  content: CvContent | null;
  user: { id: string; email: string };
};

/** CV у людини один: повертає його або null. */
export const getMyCv = (userId: string) =>
  request<CvDetail | null>(`/cvs?userId=${encodeURIComponent(userId)}`);

export const createCv = (title: string, userId: string) =>
  postJson<CvDetail>('/cvs', { title, userId });

export const updateCv = (
  id: string,
  body: { title?: string; fileUrl?: string; manualSkills?: string[] },
) =>
  request<CvDetail>(`/cvs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const deleteCv = (id: string) =>
  request<{ id: string; title: string }>(`/cvs/${id}`, { method: 'DELETE' });

export const listCompanies = (search?: string) =>
  request<CompanyListItem[]>(
    `/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  );

/** Віддає шлях на кшталт /files/<uuid>.png — його і кладемо в logoUrl. */
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  // Content-Type не ставимо вручну — браузер сам додасть boundary.
  return request<{ url: string; filename: string }>('/uploads', {
    method: 'POST',
    body: form,
  });
}

/** Робить із відносного шляху повний URL до бекенду. */
export const fileUrl = (path: string | null) =>
  path ? (path.startsWith('http') ? path : `${API_URL}${path}`) : null;
