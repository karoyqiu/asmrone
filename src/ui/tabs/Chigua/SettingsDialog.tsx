import { open } from '@tauri-apps/plugin-dialog';
import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useLocalStorage } from 'primereact/hooks';
import { InputText } from 'primereact/inputtext';
import { useId } from 'react';

type SettingsDialogProps = {
  visible: boolean;
  onHide: () => void;
};

export default function SettingsDialog(props: SettingsDialogProps) {
  const { visible, onHide } = props;
  const [dir, setDir] = useLocalStorage('', 'chiguaDir');
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
      </div>
    </Dialog>
  );
}
