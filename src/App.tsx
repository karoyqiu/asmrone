import { TabPanel, TabView } from 'primereact/tabview';

import '@/App.css';
import AsmrTab from '@/ui/tabs/AsmrTab';

function App() {
  return (
    <TabView
      pt={{
        root: { className: 'h-full flex flex-column' },
        panelContainer: { className: 'flex-grow-1 p-2' },
      }}
    >
      <TabPanel className="h-full" header="asmr.one">
        <AsmrTab />
      </TabPanel>
    </TabView>
  );
}

export default App;
