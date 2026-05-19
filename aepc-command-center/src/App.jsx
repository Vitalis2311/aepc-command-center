import React from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import CommandCenter from './CommandCenter';

export default function App() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <button
          onClick={handleLogin}
          className="bg-lime-500 text-black px-6 py-3 font-bold"
        >
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
          className="bg-lime-500 text-black px-4 py-2 font-bold"
        >
          Logout
        </button>
      </div>

      <CommandCenter />
    </>
  );
}