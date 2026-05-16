import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RTSDashboard from './pages/RTSDashboard';
import DAPerformance from './pages/DAPerformance';
import CDFSB from './pages/CDFSB';
import DataManagement from './pages/DataManagement';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RTSDashboard />} />
          <Route path="da-performance" element={<DAPerformance />} />
          <Route path="cdf-dsb" element={<CDFSB />} />
          <Route path="data" element={<DataManagement />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
