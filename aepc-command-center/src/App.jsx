import React, { useState, useEffect } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import CommandCenter from './CommandCenter.jsx';

const SESSION_KEY = 'aepc:authenticated';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  // On mount, check sessionStorage so a refresh during the same browser session
  // doesn't force re-entry of the password.
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem(SESSION_KEY);
      if (flag === 'true') setAuthenticated(true);
    } catch (e) { /* sessionStorage unavailable */ }
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!authenticated) {
    return (
      <PasswordGate
        onSuccess={() => {
          try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}
          setAuthenticated(true);
        }}
      />
    );
  }

  return <CommandCenter />;
}
