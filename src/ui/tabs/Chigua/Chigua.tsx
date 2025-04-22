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

import { download, getVideoUrls } from '@/lib/chigua';

import SettingsDialog from './SettingsDialog';
import VideoTable from './VideoTable';

export default function ChiguaTab() {
  const [inputUrl, url, setUrl] = useDebounce('', 500);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [videos, setVideos] = useState<string[]>([]);
  const [checked, setChecked] = useState<TreeCheckboxSelectionKeys | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [streamlink] = useLocalStorage('', 'streamlink');
  const [dir] = useLocalStorage('', 'chiguaDir');
  const toast = useRef<Toast>(null);

  const selected = useMemo(
    () => videos.filter((video) => checked && checked[video]?.checked),
    [videos, checked],
  );

  useEffect(() => {
    if (url) {
      try {
        setLoading(true);

        const u = new URL(url);
        const paths = u.pathname.split('/');
        console.log(paths);
        setCode(paths[2]);

        getVideoUrls(url)
          .then(setVideos)
          .catch(console.error)
          .finally(() => setLoading(false));
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
  }, [url]);

  return (
    <main className="flex-column flex h-full gap-2">
      <div className="flex gap-2">
        <IconField className="flex-grow-1" iconPosition="left">
          <InputIcon className={PrimeIcons.SEARCH} />
          <InputText
            className="w-full"
            autoFocus
            placeholder="URL"
            type="search"
            disabled={loading}
            value={inputUrl}
            onChange={(e) => setUrl(e.target.value)}
          />
        </IconField>
      </div>
      <ScrollPanel className="border-200 border-1 border-round min-h-0 flex-auto">
        <VideoTable loading={loading} videos={videos} checked={checked} onCheck={setChecked} />
      </ScrollPanel>
      <div className="flex gap-2">
        <Button icon={PrimeIcons.COG} onClick={() => setSettingsVisible(true)} />
        <Button
          className="flex-1"
          label="Download"
          icon={PrimeIcons.DOWNLOAD}
          disabled={loading || downloading || selected.length === 0}
          loading={downloading}
          onClick={async () => {
            setDownloading(true);
            await download(streamlink, code, selected, dir);
            setDownloading(false);
          }}
        />
      </div>
      <SettingsDialog visible={settingsVisible} onHide={() => setSettingsVisible(false)} />
      <Toast ref={toast} />
    </main>
  );
}
