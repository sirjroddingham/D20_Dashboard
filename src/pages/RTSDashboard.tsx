import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import CSVUpload from '../components/CSVUpload';
import FilterBar from '../components/FilterBar';
import RTSPieChart from '../components/RTSPieChart';
import StackedBarChart from '../components/StackedBarChart';
import Element3 from '../components/Element3';
import DetailTable from '../components/DetailTable';
import EmptyState from '../components/EmptyState';

export default function RTSDashboard() {
  const rawData = useDashboardStore(s => s.rawData);
  const fileName = useDashboardStore(s => s.fileName);
  const filteredData = useDashboardStore(s => s.filteredData);

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
        <CSVUpload compact />
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
    </div>
  );
}
