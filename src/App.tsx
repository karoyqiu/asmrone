import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { useDebounce } from 'primereact/hooks';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';

import './App.css';
import { Track, getTracks } from './lib/asmrone';

function App() {
  const [inputRjid, rjid, setRjid] = useDebounce('', 500);
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    let id = rjid.toUpperCase();

    if (id.startsWith('RJ')) {
      id = id.substring(2);
    }

    if (id) {
      getTracks(id).then(setTracks).catch(console.error);
    }
  }, [rjid]);

  useEffect(() => {
    console.dir(tracks);
  }, [tracks]);

  return (
    <main className="flex flex-column gap-1">
      <IconField iconPosition="left">
        <InputIcon className={PrimeIcons.SEARCH} />
        <InputText
          className="w-full"
          autoFocus
          placeholder="RJID"
          value={inputRjid}
          onChange={(e) => setRjid(e.target.value)}
        />
      </IconField>
      <Button>Just a button</Button>
    </main>
  );
}

export default App;
