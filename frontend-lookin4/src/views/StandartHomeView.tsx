'use client';

import { useState } from 'react';
import Image from 'next/image';
import BusinessPage from './BusinessPage';
import JobPage from './JobPage';
import AuthPage from './AuthPage';
import CreateOrganigramPage, { EditCompany } from '../services/CreateOrganigram';
import CompanyPage from './CompanyPage';
import OffrePage from './OffrePage';
import CVPage from './CVPage';
import LearnPage from './LearnPage';
import FormationPage from './FormationPage';
import MarketPage from './MarketPage';
import AccountPage, { type EditTarget } from './AccountPage';
import ProductPage from './ProductPage';
import CreateProduct from '../services/CreateProduct';
import CreateFormation from '../services/CreateFormation';
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
  const [creatingFormation, setCreatingFormation] = useState(false);
  const [openFormationId, setOpenFormationId] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null);
  const [openOffreId, setOpenOffreId] = useState<string | null>(null);
  // Компанія, зі сторінки якої відкрили offre — щоб «Retour» вернув саме туди.
  const [offreOrigin, setOffreOrigin] = useState<string | null>(null);
  const [showCv, setShowCv] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const showAuth = authReason !== null;

  /** Закриває все відкрите: вкладка чи кабінет завжди стартують із чистого стану. */
  function closeAll() {
    setAuthReason(null);
    setCreating(false);
    setCreatingFormation(false);
    setOpenFormationId(null);
    setCreatingProduct(false);
    setOpenProductId(null);
    setOpenCompanyId(null);
    setOpenOffreId(null);
    setOffreOrigin(null);
    setShowCv(false);
    setShowAccount(false);
    setEditTarget(null);
  }

  function openAccount() {
    closeAll();
    setShowAccount(true);
  }

  function logout() {
    closeAll();
    onLogout();
  }

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

  // Той самий порядок, що й у рендері нижче: кнопка закриває те, що зараз видно.
  const goBack = showAuth
    ? () => setAuthReason(null)
    : editTarget
      ? () => setEditTarget(null)
      : showCv && session
        ? () => setShowCv(false)
        : showAccount
          ? () => setShowAccount(false)
          : creating
            ? () => setCreating(false)
            : creatingFormation
              ? () => setCreatingFormation(false)
              : openFormationId
                ? () => setOpenFormationId(null)
                : creatingProduct
                  ? () => setCreatingProduct(false)
                  : openProductId
                    ? () => setOpenProductId(null)
                    : openCompanyId
                      ? () => setOpenCompanyId(null)
                      : openOffreId
                        ? () => {
                            setOpenOffreId(null);
                            setOpenCompanyId(offreOrigin);
                            setOffreOrigin(null);
                          }
                        : null;

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
                    closeAll();
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
                <button
                  type="button"
                  onClick={openAccount}
                  className="hidden max-w-40 truncate text-sm opacity-70 transition-opacity hover:opacity-100 sm:block"
                >
                  {user}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-[rgb(128_128_128/0.3)] px-4 py-1.5 text-sm transition-colors hover:bg-[rgb(128_128_128/0.1)]"
                >
                  Se déconnecter
                </button>
                <button
                  type="button"
                  onClick={openAccount}
                  aria-label="Mon compte"
                  title="Mon compte"
                  className="rounded-full p-1 transition-colors hover:bg-[rgb(128_128_128/0.15)]"
                >
                  <Image
                    src="/icons/user-icon-profile.webp"
                    alt=""
                    width={30}
                    height={30}
                    className="dark:invert"
                  />
                </button>
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
        {goBack && (
          <button
            type="button"
            onClick={goBack}
            className="sticky top-20 z-10 mb-6 flex items-center gap-2 rounded-full border border-[rgb(128_128_128/0.3)] bg-background px-4 py-1.5 text-sm transition-colors hover:border-[rgb(128_128_128/0.7)]"
          >
            <span aria-hidden>←</span>
            Retour
          </button>
        )}

        {showAuth ? (
          <AuthPage
            onAuth={handleAuth}
            reason={authReason || undefined}
          />
        ) : editTarget && session ? (
          editTarget.kind === 'company' ? (
            <EditCompany
              companyId={editTarget.id}
              session={session}
              onSaved={() => setEditTarget(null)}
            />
          ) : editTarget.kind === 'formation' ? (
            <CreateFormation
              session={session}
              initial={editTarget.formation}
              onSaved={() => setEditTarget(null)}
            />
          ) : (
            <CreateProduct
              session={session}
              initial={editTarget.product}
              onSaved={() => setEditTarget(null)}
            />
          )
        ) : showCv && session ? (
          <CVPage session={session} />
        ) : showAccount && session ? (
          <AccountPage
            session={session}
            onEdit={setEditTarget}
            onOpenCv={() => setShowCv(true)}
          />
        ) : creating ? (
          <CreateOrganigramPage
            session={session}
            onSaved={() => {
              setCreating(false);
              // Змушує BusinessPage перечитати список
              setReloadKey((k) => k + 1);
            }}
          />
        ) : creatingFormation ? (
          <CreateFormation
            session={session}
            onSaved={() => setCreatingFormation(false)}
          />
        ) : openFormationId ? (
          <FormationPage formationId={openFormationId} />
        ) : creatingProduct ? (
          <CreateProduct
            session={session}
            onSaved={() => setCreatingProduct(false)}
          />
        ) : openProductId ? (
          <ProductPage productId={openProductId} />
        ) : openCompanyId ? (
          <CompanyPage
            companyId={openCompanyId}
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
            onOpenCompany={(id) => {
              setOpenOffreId(null);
              setOffreOrigin(null);
              setOpenCompanyId(id);
            }}
          />
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
        ) : choice === 'Market' ? (
          <MarketPage
            onOpen={setOpenProductId}
            onCreate={() =>
              requireAuth('Connectez-vous pour vendre un produit.', () =>
                setCreatingProduct(true),
              )
            }
          />
        ) : choice === 'Learn' ? (
          <LearnPage
            onOpen={setOpenFormationId}
            onCreate={() =>
              requireAuth('Connectez-vous pour créer une promo.', () =>
                setCreatingFormation(true),
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
