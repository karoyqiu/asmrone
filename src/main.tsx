import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

if (!import.meta.env.DEV) {
  document.addEventListener('contextmenu', (event) => {
    if (!event.target || !('tagName' in event.target) || event.target.tagName !== 'INPUT') {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PrimeReactProvider value={{ nonce: 'ss8Pp2gtzJFjs8y9GAtSS' }}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
