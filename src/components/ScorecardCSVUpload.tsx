import { useCallback, useRef, useState } from 'react';
import { Upload, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseScorecardCSV } from '../lib/scorecard/parseScorecard';
import { useDAPerformanceStore } from '../store/useDAPerformanceStore';

interface ScorecardCSVUploadProps {
  compact?: boolean;
}

export default function ScorecardCSVUpload({ compact = false }: ScorecardCSVUploadProps) {
  const mergeRows = useDAPerformanceStore(s => s.mergeRows);
  const setFileName = useDAPerformanceStore(s => s.setFileName);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files).filter(
      f => f.type === 'text/csv' || f.name.endsWith('.csv')
    );

    if (fileArray.length === 0) {
      setError('Please select valid CSV files.');
      return;
    }

    const readFile = (file: File): Promise<{ rows: ReturnType<typeof parseScorecardCSV>; warnings: string[] }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) {
            resolve({ rows: [], warnings: [`Failed to read ${file.name}.`] });
            return;
          }
          resolve({ rows: parseScorecardCSV(text), warnings: [] });
        };
        reader.onerror = () => {
          resolve({ rows: [], warnings: [`Failed to read ${file.name}.`] });
        };
        reader.readAsText(file);
      });
    };

    Promise.all(fileArray.map(f => readFile(f))).then(results => {
      const allRows = results.flatMap(r => r.rows);
      const allWarnings = results.flatMap(r => r.warnings);

      if (allRows.length === 0) {
        setError('No scorecard data found. Make sure the CSV has the correct column headers.');
        return;
      }

      if (allWarnings.length > 0) {
        setError(allWarnings.join(' '));
      }

      setFileName(`${fileArray[0].name} (${allRows.length} rows)`);
      mergeRows(allRows);
    });
  }, [mergeRows, setFileName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded p-1.5 text-text-body transition-colors hover:bg-surface-hover hover:text-text-subtle"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="h-4 w-4" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 flex items-start gap-2 rounded-md border border-amber-900/30 bg-amber-950/20 px-4 py-2 text-sm text-amber-400/80"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer rounded-lg border-2 border-dashed border-surface-3 bg-surface-2/50 p-8 text-center transition-colors hover:border-surface-hover hover:bg-surface-hover"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload className="mx-auto mb-3 h-10 w-10 text-text-faint" />
        <p className="mb-1 text-lg font-medium text-text-subtle">Drop Scorecard CSV files here or click to browse</p>
        <p className="text-sm text-text-body">Upload 1 or more weekly Scorecard CSV files to combine</p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-faint">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3 w-3" />
            <span>Auto-maps column headers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span>Combines multiple weeks safely</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
