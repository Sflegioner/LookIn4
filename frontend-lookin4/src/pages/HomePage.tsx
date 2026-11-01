'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import StandartHomeView from './StandartHomeView';
import {
  readSession,
  saveSession,
  clearSession,
  type Session,
} from '../session';

const COOKIE = 'lookin4';
const OPTIONS = ['Business', 'Job', 'Market', 'Learn'];
const YEAR = 31536000;

function readCookie(name: string) {
  const hit = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`));

  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}


const SHAPES = [
  { w: 190, h: 110, x: '6%', y: '14%', dx: '48px', dy: '-34px', r: '5deg', t: '23s' },
  { w: 90, h: 140, x: '21%', y: '68%', dx: '-36px', dy: '30px', r: '-7deg', t: '31s' },
  { w: 240, h: 80, x: '73%', y: '22%', dx: '-52px', dy: '26px', r: '4deg', t: '27s' },
  { w: 120, h: 120, x: '86%', y: '61%', dx: '30px', dy: '-44px', r: '-5deg', t: '35s' },
  { w: 150, h: 70, x: '44%', y: '8%', dx: '40px', dy: '34px', r: '6deg', t: '29s' },
  { w: 80, h: 100, x: '57%', y: '82%', dx: '-30px', dy: '-28px', r: '-8deg', t: '25s' },
  { w: 130, h: 160, x: '33%', y: '38%', dx: '34px', dy: '40px', r: '3deg', t: '38s' },
  { w: 100, h: 60, x: '92%', y: '9%', dx: '-40px', dy: '36px', r: '-4deg', t: '33s' },
  { w: 170, h: 90, x: '11%', y: '44%', dx: '44px', dy: '-24px', r: '7deg', t: '26s' },
];

function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className="drift absolute rounded-lg bg-[rgb(128_128_128/0.14)]"
          style={
            {
              width: s.w,
              height: s.h,
              left: s.x,
              top: s.y,
              animation: `drift ${s.t} ease-in-out ${i * -3}s infinite`,
              '--dx': s.dx,
              '--dy': s.dy,
              '--rot': s.r,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [choice, setChoice] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readCookie(COOKIE));
    setSession(readSession());
    setReady(true);
  }, []);

  function pick(option: string) {
    document.cookie = `${COOKIE}=${option}; path=/; max-age=${YEAR}`;
    setChoice(option);
  }

  function login(next: Session) {
    saveSession(next);
    setSession(next);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  if (!ready) return null;


  if (choice) {
    return (
      <StandartHomeView
        choice={choice}
        options={OPTIONS}
        onSelect={pick}
        user={session?.email ?? null}
        session={session}
        onLogin={login}
        onLogout={logout}
      />
    );
  }

  if (!showOptions) {
    return (
      <>
        <Background />
        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <div className="text-4xl font-semibold">
            Le premier site de Rencontre Industrielle
          </div>
          <button
            onClick={() => setShowOptions(true)}
            className="rounded-full border bg-background px-8 py-3"
          >
            Enter
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Background />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-3 px-6">
        {OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => pick(option)}
            className="w-64 rounded-lg border bg-background px-6 py-3"
          >
            Look in 4 <span>{option}</span>
          </button>
        ))}
      </main>
    </>
  );
}
