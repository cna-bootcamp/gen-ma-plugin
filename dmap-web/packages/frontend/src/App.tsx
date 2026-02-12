import { useState } from 'react';
import { Layout } from './components/Layout';
import { StartupCheck } from './components/StartupCheck';

const CACHE_KEY = 'dmap-startup-check-passed';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

function isRecentlyPassed(): boolean {
  const ts = localStorage.getItem(CACHE_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < CACHE_TTL_MS;
}

export default function App() {
  const [ready, setReady] = useState(isRecentlyPassed());

  const handleReady = () => {
    localStorage.setItem(CACHE_KEY, String(Date.now()));
    setReady(true);
  };

  return (
    <>
      {!ready && <StartupCheck onReady={handleReady} />}
      {ready && <Layout />}
    </>
  );
}
