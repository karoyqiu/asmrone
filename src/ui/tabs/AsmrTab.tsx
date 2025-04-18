import { ProgressBarStatus, getCurrentWindow } from '@tauri-apps/api/window';
import type { Child } from '@tauri-apps/plugin-shell';
import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { useDebounce, useLocalStorage } from 'primereact/hooks';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Toast } from 'primereact/toast';
import type { TreeCheckboxSelectionKeys } from 'primereact/tree';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Track, download, getTracks, normalizeAudios } from '@/lib/asmrone';
import { formatSize } from '@/lib/format';
import SettingsDialog from '@/ui/SettingsDialog';
import TrackTable from '@/ui/TrackTable';

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

const finishLater = () =>
  setTimeout(() => getCurrentWindow().setProgressBar({ status: ProgressBarStatus.None }), 1000);

function AsmrTab() {
  const [inputRjid, rjid, setRjid] = useDebounce('', 500);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [checked, setChecked] = useState<TreeCheckboxSelectionKeys | null>(null);
  const [child, setChild] = useState<Child>();
  const [total, setTotal] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dir] = useLocalStorage('', 'dir');
  const [proxy] = useLocalStorage('', 'proxy');
  const [proxyOnDownload] = useLocalStorage(false, 'proxyOnDownload');
  const [normalize] = useLocalStorage(false, 'normalize');
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

  const [selected, selectedMap] = useMemo(() => {
    const sel: Track[] = [];
    const map = new Map<string, Track>();

    if (checked) {
      flatSelected(sel, tracks, checked);

      for (const s of sel) {
        map.set(s.gid, s);
      }
    }

    return [sel, map] as const;
  }, [tracks, checked]);

  const onDownloadProgress = (gid: string, downloaded: number) => {
    const track = selectedMap.get(gid);

    if (track && track.type !== 'folder') {
      track.downloaded = downloaded;
      setDownloaded(
        selected.reduce((prev, track) => ('size' in track ? prev + track.downloaded : prev), 0),
      );
    }
  };

  const onNormalizationProgress = (finished: number, total: number) => {
    setDownloaded(finished);
    setTotal(total);
  };

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

  useEffect(() => {
    getCurrentWindow().setProgressBar({
      status: ProgressBarStatus.Normal,
      progress: Math.round((downloaded * 100) / total),
    });
  }, [downloaded, total]);

  return (
    <main className="flex-column flex h-full gap-2">
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
      <ScrollPanel className="border-200 border-1 border-round min-h-0 flex-auto">
        <TrackTable tracks={tracks} loading={loading} checked={checked} onCheck={setChecked} />
      </ScrollPanel>
      <div className="text-900 mt-2 text-lg font-medium">
        {total >= 1024
          ? `${formatSize(downloaded)}/${formatSize(total)}`
          : `${downloaded}/${total}`}
      </div>
      <ProgressBar
        className="mb-2 flex-shrink-0"
        value={total > 0 ? Math.round((downloaded * 100) / total) : 0}
      />
      <div className="flex gap-2">
        <Button icon={PrimeIcons.COG} onClick={() => setSettingsVisible(true)} />
        <Button
          className="flex-1"
          label={child ? 'Cancel' : 'Download'}
          icon={PrimeIcons.DOWNLOAD}
          disabled={tracks.length === 0 || !hasChecked}
          onClick={async () => {
            if (child) {
              await child.kill();
              setChild(undefined);
            } else if (checked) {
              if (selected.length > 0) {
                setDownloaded(0);

                const t = selected.reduce(
                  (prev, track) => ('size' in track ? prev + track.size : prev),
                  0,
                );
                setTotal(t);

                const c = await download(
                  selected,
                  dir,
                  proxyOnDownload ? proxy : null,
                  onDownloadProgress,
                  () => {
                    setDownloaded(t);
                    setRecords((old) => ({ ...old, [id]: Date.now() }));

                    if (normalize) {
                      normalizeAudios(selected, dir, onNormalizationProgress, finishLater).finally(
                        () => setChild(undefined),
                      );
                    } else {
                      setChild(undefined);
                      finishLater();
                    }
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

export default AsmrTab;
