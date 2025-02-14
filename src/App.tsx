import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { useDebounce } from 'primereact/hooks';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import type { TreeCheckboxSelectionKeys } from 'primereact/tree';
import { useEffect, useState } from 'react';

import './App.css';
import { Track, getTracks } from './lib/asmrone';
import TrackTable from './ui/TrackTable';

function App() {
  const [inputRjid, rjid, setRjid] = useDebounce('', 500);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [checked, setChecked] = useState<TreeCheckboxSelectionKeys | null>(null);

  useEffect(() => {
    let id = rjid.toUpperCase();

    if (id.startsWith('RJ')) {
      id = id.substring(2);
    }

    if (id) {
      setLoading(true);
      getTracks(id)
        .then(setTracks)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTracks([]);
    }
  }, [rjid]);

  return (
    <main className="flex flex-column gap-2 h-full p-2">
      <div className="flex gap-2">
        <IconField className="flex-grow-1" iconPosition="left">
          <InputIcon className={PrimeIcons.SEARCH} />
          <InputText
            className="w-full"
            autoFocus
            placeholder="RJID"
            type="search"
            disabled={loading}
            value={inputRjid}
            onChange={(e) => setRjid(e.target.value)}
          />
        </IconField>
      </div>
      <ScrollPanel className="flex-auto min-h-0 border-200 border-1 border-round">
        <TrackTable tracks={tracks} loading={loading} checked={checked} onCheck={setChecked} />
      </ScrollPanel>
      <Button label="Download" icon={PrimeIcons.DOWNLOAD} disabled={tracks.length === 0} />
    </main>
  );
}

export default App;
