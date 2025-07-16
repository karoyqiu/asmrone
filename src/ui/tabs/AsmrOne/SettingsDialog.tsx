import { open } from '@tauri-apps/plugin-dialog';
import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useLocalStorage } from 'primereact/hooks';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { useId } from 'react';

type SettingsDialogProps = {
  visible: boolean;
  onHide: () => void;
};

export default function SettingsDialog(props: SettingsDialogProps) {
  const { visible, onHide } = props;
  const [dir, setDir] = useLocalStorage('', 'dir');
  const [proxy, setProxy] = useLocalStorage('', 'proxy');
  const [proxyOnDownload, setProxyOnDownload] = useLocalStorage(false, 'proxyOnDownload');
  const [normalize, setNormalize] = useLocalStorage(false, 'normalize');
  const id = useId();

  return (
    <Dialog className="w-30rem" header="Settings" visible={visible} onHide={onHide} dismissableMask>
      <div className="flex-column flex gap-4">
        <div className="flex-column flex gap-2">
          <label htmlFor={`${id}d`}>Download directory</label>
          <div className="p-inputgroup">
            <InputText id={`${id}d`} value={dir} readOnly />
            <Button
              icon={PrimeIcons.FOLDER_OPEN}
              onClick={async () => {
                const value = await open({ defaultPath: dir, directory: true });

                if (value) {
                  setDir(value);
                }
              }}
            />
          </div>
        </div>
        <div className="flex-column flex gap-2">
          <label htmlFor={`${id}p`}>Proxy</label>
          <InputText id={`${id}p`} value={proxy} onChange={(e) => setProxy(e.target.value)} />
        </div>
        <div className="align-items-center justify-content-between flex">
          <label htmlFor={`${id}pod`}>Use proxy when downloading</label>
          <InputSwitch
            id={`${id}pod`}
            checked={proxyOnDownload}
            onChange={(e) => setProxyOnDownload(e.value)}
          />
        </div>
        <div className="align-items-center justify-content-between flex">
          <label htmlFor={`${id}n`}>Normalize audio files after being downloaded</label>
          <InputSwitch id={`${id}n`} checked={normalize} onChange={(e) => setNormalize(e.value)} />
        </div>
      </div>
    </Dialog>
  );
}
