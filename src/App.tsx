import type { Child } from '@tauri-apps/plugin-shell';
import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { useDebounce, useLocalStorage } from 'primereact/hooks';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Toast } from 'primereact/toast';
import type { TreeCheckboxSelectionKeys } from 'primereact/tree';
import { useEffect, useMemo, useRef, useState } from 'react';

import './App.css';
import { Track, download, getTracks } from './lib/asmrone';
import SettingsDialog from './ui/SettingsDialog';
import TrackTable from './ui/TrackTable';

const flatSelected = (selected: Track[], tracks: Track[], checked: TreeCheckboxSelectionKeys) => {
  for (const track of tracks) {
    const tc = checked[track.gid];

    if (tc?.checked || tc?.partialChecked) {
      if (track.type === 'folder') {
        flatSelected(selected, track.children, checked);
      } else {
        selected.push(track);
      }
    }
  }
};

const flatMap = (map: Map<string, Track>, tracks: Track[]) => {
  for (const track of tracks) {
    map.set(track.gid, track);

    if (track.type === 'folder') {
      flatMap(map, track.children);
    }
  }
};

function App() {
  const [inputRjid, rjid, setRjid] = useDebounce('', 500);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [checked, setChecked] = useState<TreeCheckboxSelectionKeys | null>(null);
  const [child, setChild] = useState<Child>();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dir] = useLocalStorage('', 'dir');
  const [proxy] = useLocalStorage('', 'proxy');
  const [proxyOnDownload] = useLocalStorage(false, 'proxyOnDownload');
  const [records, setRecords] = useLocalStorage<Record<string, number>>({}, 'records');
  const toast = useRef<Toast>(null);

  const hasChecked = !!checked && Object.values(checked).some((value) => value.checked);

  const id = useMemo(() => {
    let id = rjid.trim().toUpperCase();

    if (id.startsWith('RJ')) {
      id = id.substring(2);
    }

    return id;
  }, [rjid]);

  useEffect(() => {
    if (toast.current) {
      const ts = records[id];

      if (ts && ts < Date.now() - 3000) {
        const dt = new Date(ts);
        toast.current.show({
          severity: 'info',
          summary: 'Work has been downloaded',
          detail: `RJ${id} has been downloaded at ${dt.toLocaleString()}.`,
        });
      }
    }
  }, [id]);

  const trackMap = useMemo(() => {
    const map = new Map<string, Track>();
    flatMap(map, tracks);
    return map;
  }, [tracks]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getTracks(id, proxy)
        .then(setTracks)
        .catch((e) => {
          setTracks([]);
          console.error(e);

          if ('error' in e) {
            toast.current?.show({
              severity: 'error',
              summary: 'Error',
              detail: e.error,
            });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setTracks([]);
    }
  }, [id, proxy]);

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
      <div className="flex gap-2">
        <Button icon={PrimeIcons.COG} onClick={() => setSettingsVisible(true)} />
        <Button
          className="flex-1"
          label={child ? 'Cancel' : 'Download'}
          icon={PrimeIcons.DOWNLOAD}
          disabled={tracks.length === 0 || !hasChecked}
          onClick={async () => {
            if (child) {
              console.warn('Cancelling');
              await child.kill();
            } else if (checked) {
              const selected: Track[] = [];
              flatSelected(selected, tracks, checked);

              if (selected.length > 0) {
                const c = await download(
                  selected,
                  dir,
                  proxyOnDownload ? proxy : null,
                  (gid, progress) => {
                    const track = trackMap.get(gid);

                    if (track && track.type !== 'folder') {
                      track.progress = progress;
                    }
                  },
                  () => {
                    setChild(undefined);
                    setRecords((old) => ({ ...old, [id]: Date.now() }));
                  },
                );
                setChild(c);
              }
            }
          }}
        />
      </div>
      <SettingsDialog visible={settingsVisible} onHide={() => setSettingsVisible(false)} />
      <Toast ref={toast} />
    </main>
  );
}

export default App;
