import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { GreeksDashboard } from './components/dashboard/GreeksDashboard';
import { DEFAULT_PARAMS, OptionParams } from './types';

function App() {
  const [params, setParams] = useState<OptionParams>(DEFAULT_PARAMS);

  return (
    <MainLayout params={params} setParams={setParams}>
      <GreeksDashboard params={params} />
    </MainLayout>
  );
}

export default App;
