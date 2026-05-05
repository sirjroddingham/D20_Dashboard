import { useDashboardStore } from './store/useDashboardStore';
import CSVUpload from './components/CSVUpload';
import FilterBar from './components/FilterBar';
import RTSPieChart from './components/RTSPieChart';
import StackedBarChart from './components/StackedBarChart';
import Element3 from './components/Element3';
import DetailTable from './components/DetailTable';
import EmptyState from './components/EmptyState';
import ThemeToggle from './components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import D20Logo from '/just_the_d20.svg';

function Dashboard() {
  const rawData = useDashboardStore(s => s.rawData);
  const fileName = useDashboardStore(s => s.fileName);
  const filteredData = useDashboardStore(s => s.filteredData);

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-surface-3 sticky top-0 z-50 header-card backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <img src={D20Logo} alt="D20 Industries" className="h-10 w-10" />
               <div>
                 <h1 className="text-sm font-medium text-text-heading">RTS Dashboard</h1>
                 <p className="text-xs text-text-body">D20 Industries, LLC</p>
               </div>
             </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {fileName && (
                <div className="flex items-center gap-2 rounded-md bg-surface-1 border border-surface-3 px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5 text-text-body" />
                  <span className="text-xs text-text-subtle">{fileName}</span>
                </div>
              )}
              <CSVUpload compact />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <AnimatePresence mode="wait">
          {rawData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <FilterBar />

              {filteredData.length < rawData.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-text-body"
                >
                  Showing {filteredData.length.toLocaleString()} of {rawData.length.toLocaleString()} records
                </motion.div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RTSPieChart />
                <StackedBarChart />
              </div>

              <Element3 />
              <DetailTable />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-surface-3 py-3 footer-card backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 text-center text-xs text-text-faint">
          RTS Dashboard &middot; D20 Industries, LLC
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <Dashboard />;
}

export default App;
