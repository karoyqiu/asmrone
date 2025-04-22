import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Toast } from 'primereact/toast';

import { download, normalizeAudios } from '@/lib/asmrone';
import { formatSize } from '@/lib/format';

export default function ChiguaTab() {
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
