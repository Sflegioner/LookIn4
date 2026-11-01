'use client';

import { useState } from 'react';
import Image from 'next/image';
import BusinessPage from './BusinessPage';
import JobPage from './JobPage';
import AuthPage from './AuthPage';
import CreateOrganigramPage from '../services/CreateOrganigram';
import CompanyPage from './CompanyPage';
import OffrePage from './OffrePage';
import CVPage from './CVPage';
import type { Session } from '../session';

type Props = {
  choice: string;
  options: readonly string[];
  onSelect: (option: string) => void;
  user: string | null;
  session: Session | null;
  onLogin: (session: Session) => void;
  onLogout: () => void;
};

export default function StandartHomeView({
  choice,
  options,
  onSelect,
  user,
  session,
  onLogin,
  onLogout,
}: Props) {
  // null — форму не показуємо; рядок — показуємо з поясненням, чому.
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null);
  const [openOffreId, setOpenOffreId] = useState<string | null>(null);
  // Компанія, зі сторінки якої відкрили offre — щоб «Retour» вернув саме туди.
  const [offreOrigin, setOffreOrigin] = useState<string | null>(null);
  const [showCv, setShowCv] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const showAuth = authReason !== null;

  /** Дія лише для залогінених: інакше веде на форму входу. */
  function requireAuth(reason: string, action: () => void) {
    if (user) {
      action();
      return;
    }
    setAuthReason(reason);
  }

  function handleAuth(session: Session) {
    onLogin(session);
    setAuthReason(null);
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-20 border-b border-[rgb(128_128_128/0.25)] bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Image
            src="/img/logo.png"
            alt="Lookin'4"
            width={980}
            height={296}
            priority
            className="h-10 w-auto shrink-0"
          />

          <ul className="flex items-center gap-1 overflow-x-auto">
            {options.map((option) => (
              <li key={option}>
                <button
                  onClick={() => {
                    onSelect(option);
                    setAuthReason(null);
                    setCreating(false);
                    setOpenCompanyId(null);
                    setOpenOffreId(null);
                    setOffreOrigin(null);
                    setShowCv(false);
                  }}
                  aria-current={option === choice ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm whitespace-nowrap transition-opacity ${
                    option === choice
                      ? 'bg-[rgb(128_128_128/0.15)] font-medium'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {user ? (
              <>
                <span className="hidden max-w-40 truncate text-sm opacity-70 sm:block">
                  {user}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-[rgb(128_128_128/0.3)] px-4 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
                >
                  Se déconnecter
                </button>
                <span aria-hidden className="rounded-full p-1">
                  <Image
                    src="/icons/user-icon-profile.webp"
                    alt=""
                    width={30}
                    height={30}
                    className="dark:invert"
                  />
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthReason('')}
                className="flex items-center gap-2 rounded-full border border-[rgb(128_128_128/0.3)] px-4 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
              >
                <Image
                  src="/icons/user-icon-profile.webp"
                  alt=""
                  width={20}
                  height={20}
                  className="dark:invert"
                />
                Se connecter
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {showAuth ? (
          <AuthPage
            onAuth={handleAuth}
            onCancel={() => setAuthReason(null)}
            reason={authReason || undefined}
          />
        ) : creating ? (
          <CreateOrganigramPage
            session={session}
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              // Змушує BusinessPage перечитати список
              setReloadKey((k) => k + 1);
            }}
          />
        ) : openCompanyId ? (
          <CompanyPage
            companyId={openCompanyId}
            onBack={() => setOpenCompanyId(null)}
            onOpenOffre={(id) => {
              setOffreOrigin(openCompanyId);
              setOpenCompanyId(null);
              setOpenOffreId(id);
            }}
          />
        ) : openOffreId ? (
          <OffrePage
            offreId={openOffreId}
            session={session}
            onBack={() => {
              setOpenOffreId(null);
              setOpenCompanyId(offreOrigin);
              setOffreOrigin(null);
            }}
            onOpenCompany={(id) => {
              setOpenOffreId(null);
              setOffreOrigin(null);
              setOpenCompanyId(id);
            }}
          />
        ) : showCv && session ? (
          <CVPage session={session} onBack={() => setShowCv(false)} />
        ) : choice === 'Business' ? (
          <BusinessPage
            reloadKey={reloadKey}
            onOpen={setOpenCompanyId}
            onCreate={() =>
              requireAuth('Connectez-vous pour créer un organigramme.', () =>
                setCreating(true),
              )
            }
          />
        ) : choice === 'Job' ? (
          <JobPage
            session={session}
            onRequireAuth={() =>
              setAuthReason('Connectez-vous pour comparer les offres à votre CV.')
            }
            onOpen={(id) => {
              // Зі списку вакансій — повертати нема куди, крім самого списку.
              setOffreOrigin(null);
              setOpenOffreId(id);
            }}
            onCreate={() =>
              requireAuth('Connectez-vous pour voir votre CV.', () =>
                setShowCv(true),
              )
            }
          />
        ) : (
          <h1 className="text-3xl font-semibold">
            Look in 4 <span>{choice}</span>
          </h1>
        )}
      </main>
    </div>
  );
}
