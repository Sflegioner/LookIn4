'use client';

import { useState, type FormEvent } from 'react';
import { login, register, type Session } from '../session';

type Props = {
  /** Викликається після успішного входу або реєстрації. */
  onAuth: (session: Session) => void;
  /** Текст-пояснення, якщо сюди привела спроба захищеної дії. */
  reason?: string;
};

const inputClass =
  'w-full rounded-lg border border-[rgb(128_128_128/0.3)] bg-transparent px-4 py-2.5 text-sm';

export default function AuthPage({ onAuth, reason }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isRegister = mode === 'register';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (isRegister && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPending(true);
    try {
      const call = isRegister ? register : login;
      // Пароль іде на бекенд і ніде не зберігається на клієнті.
      onAuth(await call(email.trim(), password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setPending(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
    setPassword('');
    setConfirm('');
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-[rgb(128_128_128/0.25)] p-6">
      <h2 className="font-playfair text-2xl">
        {isRegister ? 'Créer un compte' : 'Se connecter'}
      </h2>

      {reason && <p className="mt-2 text-sm opacity-70">{reason}</p>}

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-70">Mot de passe</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {isRegister && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-70">Confirmer le mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full border border-[rgb(128_128_128/0.35)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgb(128_128_128/0.1)] disabled:opacity-50"
        >
          {pending ? '…' : isRegister ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[rgb(128_128_128/0.2)] pt-4 text-sm">
        <button
          type="button"
          onClick={switchMode}
          className="underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
        >
          {isRegister ? 'Déjà un compte ?' : 'Créer un compte'}
        </button>
      </div>
    </section>
  );
}
