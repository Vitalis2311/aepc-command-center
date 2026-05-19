import React from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import CommandCenter from './CommandCenter';

export default function App() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-lime-400 mb-2">AEPC Command Center</h1>
          <p className="text-stone-400 text-sm">Sign in with your Microsoft account to continue</p>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 font-semibold rounded hover:bg-stone-100 transition"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-lime-500 text-black px-4 py-2 font-bold text-sm rounded hover:bg-lime-400 transition"
        >
          Logout
        </button>
      </div>
      <CommandCenter />
    </>
  );
}
