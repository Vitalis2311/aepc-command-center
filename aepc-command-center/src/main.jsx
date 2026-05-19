import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

import App from './App';
import './index.css';

import { msalConfig } from './authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

async function bootstrap() {
  await msalInstance.initialize();

  try {
    const response = await msalInstance.handleRedirectPromise();

    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    } else {
      const accounts = msalInstance.getAllAccounts();

      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  } catch (err) {
    console.error('MSAL Redirect Error:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
}

bootstrap();