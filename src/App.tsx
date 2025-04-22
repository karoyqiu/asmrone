import { TabPanel, TabView } from 'primereact/tabview';

import '@/App.css';
import AsmrOne from '@/ui/tabs/AsmrOne';
import Chigua from '@/ui/tabs/Chigua/Chigua';

export default function App() {
  return (
    <TabView
      pt={{
        root: { className: 'h-full flex flex-column surface-50' },
        panelContainer: { className: 'flex-grow-1 p-2' },
      }}
    >
      <TabPanel className="h-full" header="asmr.one">
        <AsmrOne />
      </TabPanel>
      <TabPanel className="h-full" header="Chigua">
        <Chigua />
      </TabPanel>
    </TabView>
  );
}
