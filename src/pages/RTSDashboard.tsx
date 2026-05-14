import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BarChart3 } from 'lucide-react';
import { useRTSStore } from '../store/useRTSStore';
import CSVUpload from '../components/CSVUpload';
import FilterBar from '../components/FilterBar';
import RTSPieChart from '../components/RTSPieChart';
import StackedBarChart from '../components/StackedBarChart';
import Element3 from '../components/Element3';
import DetailTable from '../components/DetailTable';

export default function RTSDashboard() {
  const rawData = useRTSStore(s => s.rawData);
  const fileName = useRTSStore(s => s.fileName);
  const filteredData = useRTSStore(s => s.filteredData);
  const setRawData = useRTSStore(s => s.setRawData);
  const setFileName = useRTSStore(s => s.setFileName);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-surface-1 p-4 border border-surface-3">
        <div className="flex items-center gap-3">
           <h1 className="text-lg font-medium text-text-heading">RTS Dashboard</h1>
           {fileName && (
             <div className="flex items-center gap-2 rounded-md bg-surface-0 border border-surface-3 px-3 py-1.5">
               <FileText className="h-3.5 w-3.5 text-text-body" />
               <span className="text-xs text-text-subtle">{fileName}</span>
             </div>
           )}
        </div>
        <CSVUpload compact onParsed={(data, name) => {
  setRawData(data);
  setFileName(name);
}} />
      </div>

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
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-6 rounded-xl bg-surface-1 border border-surface-3 p-6"
              >
                <BarChart3 className="h-16 w-16 text-text-icon" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-bold text-text-heading">RTS Management Dashboard</h2>
              <p className="mb-8 max-w-md text-center text-sm text-text-body">
                Upload a CSV file to begin analyzing delivery performance, RTS patterns, and employee metrics.
              </p>
              <div className="w-full max-w-lg">
                <CSVUpload onParsed={(data, name) => { setRawData(data); setFileName(name); }} />
              </div>
            </div>
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
    </div>
  );
}
