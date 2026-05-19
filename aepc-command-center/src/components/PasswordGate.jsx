import React, { useState } from 'react';

export default function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        // Store the password locally so /api/data calls can authenticate.
        // Threat model: shared-password auth — anyone with the password is a
        // legitimate operator. Storage is sessionStorage so it clears when the
        // browser closes.
        try { sessionStorage.setItem('aepc:password', password); } catch (e) {}
        onSuccess();
      } else {
        setError('Incorrect password.');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 grid-bg flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-stone-900/60 border border-stone-800 p-8 backdrop-blur"
      >
        <div className="font-mono text-[10px] tracking-[0.3em] text-arbor-green uppercase mb-2">
          Arbor · Internal
        </div>
        <h1 className="font-display text-3xl text-stone-100 mb-1 leading-tight">
          The AEPC Command Center
        </h1>
        <p className="text-sm text-stone-400 mb-8 leading-relaxed">
          For active AEPC operators only. Enter the team password to continue.
        </p>

        <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-500 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-stone-100 text-sm focus:border-arbor-green focus:outline-none mb-4"
        />

        {error && (
          <div className="font-mono text-[11px] text-rose-400 mb-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full bg-arbor-green text-stone-950 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-arbor-green-dark disabled:opacity-50"
        >
          {submitting ? 'Checking...' : 'Enter the Desk'}
        </button>

        <div className="mt-8 pt-6 border-t border-stone-800 font-mono text-[10px] text-stone-600 leading-relaxed">
          Forgot the password? Ask Taylor or Ryan. Do not share outside the
          AEPC operator team.
        </div>
      </form>
    </div>
  );
}
