import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRef } from 'react';

import { type Track, makeFullPath } from '@/lib/asmrone';

type InputTrackDialogProps = {
  visible: boolean;
  onHide: (tracks?: Track[]) => void;
};

export default function InputTrackDialog(props: InputTrackDialogProps) {
  const { visible, onHide } = props;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Dialog
      className="w-30rem"
      header="Inpup Tracks"
      visible={visible}
      onHide={() => onHide()}
      dismissableMask
      footer={
        <Button
          icon={PrimeIcons.CHECK}
          label="OK"
          onClick={() => {
            try {
              const tracks = JSON.parse(inputRef.current?.value ?? '[]') as Track[];

              for (const track of tracks) {
                makeFullPath(track, '');
              }

              onHide(tracks);
            } catch (e) {
              onHide([]);
            }
          }}
        />
      }
    >
      <InputTextarea ref={inputRef} className="w-full" rows={30} autoFocus />
    </Dialog>
  );
}
