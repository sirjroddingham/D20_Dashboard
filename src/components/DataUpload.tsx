import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle, FileText, CheckCircle, XCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSourceStore } from '../store/useDataSourceStore';
import { detectCsvType, type CsvFileType } from '../lib/detectCsvType';
import { parseRTSCSV } from '../lib/rts/parseRTSCSV';
import { parseScorecardCSV } from '../lib/scorecard/parseScorecard';
import { parseCDF } from '../lib/cdf/parseCDF';
import { parseDSB } from '../lib/dsb/parseDSB';

interface DataUploadProps {
  compact?: boolean;
}

interface FileResult {
  fileName: string;
  type: CsvFileType;
  rowsMerged: number;
  totalRows: number;
  error: string | null;
}

function readCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Read just the first line to get headers
    const slice = file.slice(0, 4096);
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        preview: 1,
        worker: false,
        download: false,
      });
      resolve(result.meta?.fields || []);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(slice);
  });
}

function readFullCsv(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

const TYPE_LABELS: Record<CsvFileType, string> = {
  rts: 'RTS',
  scorecard: 'Scorecard',
  cdf: 'CDF',
  dsb: 'DSB',
  unknown: 'Unknown',
};

const TYPE_COLORS: Record<CsvFileType, string> = {
  rts: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  scorecard: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cdf: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  dsb: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function DataUpload({ compact = false }: DataUploadProps) {
  const {
    mergeRts,
    mergeScorecard,
    mergeCdf,
    mergeDsb,
    addUploadSummary,
  } = useDataSourceStore();

  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setResults([]);
    setProcessing(true);

    const fileArray = Array.from(files).filter(
      (f) => f.type === 'text/csv' || f.name.endsWith('.csv')
    );

    if (fileArray.length === 0) {
      setError('Please select valid CSV files.');
      setProcessing(false);
      return;
    }

    const results: FileResult[] = [];

    for (const file of fileArray) {
      try {
        // Step 1: Read headers to detect type
        const headers = await readCsvHeaders(file);
        const type = detectCsvType(headers);

        if (type === 'unknown') {
          results.push({
            fileName: file.name,
            type: 'unknown',
            rowsMerged: 0,
            totalRows: 0,
            error: 'Could not detect file type. Headers did not match any known schema.',
          });
          continue;
        }

        // Step 2: Read full file and parse
        const csvText = await readFullCsv(file);
        let parsedRows: unknown[] = [];

        switch (type) {
          case 'rts':
            parsedRows = parseRTSCSV(csvText);
            mergeRts(parsedRows as ReturnType<typeof parseRTSCSV>);
            addUploadSummary({
              type: 'rts',
              fileName: file.name,
              totalRows: parsedRows.length,
              mergedRows: parsedRows.length,
              duplicateRows: 0,
              timestamp: Date.now(),
            });
            break;
          case 'scorecard':
            parsedRows = parseScorecardCSV(csvText);
            mergeScorecard(parsedRows as ReturnType<typeof parseScorecardCSV>);
            addUploadSummary({
              type: 'scorecard',
              fileName: file.name,
              totalRows: parsedRows.length,
              mergedRows: parsedRows.length,
              duplicateRows: 0,
              timestamp: Date.now(),
            });
            break;
          case 'cdf':
            parsedRows = parseCDF(csvText);
            mergeCdf(parsedRows as ReturnType<typeof parseCDF>);
            addUploadSummary({
              type: 'cdf',
              fileName: file.name,
              totalRows: parsedRows.length,
              mergedRows: parsedRows.length,
              duplicateRows: 0,
              timestamp: Date.now(),
            });
            break;
          case 'dsb':
            parsedRows = parseDSB(csvText);
            mergeDsb(parsedRows as ReturnType<typeof parseDSB>);
            addUploadSummary({
              type: 'dsb',
              fileName: file.name,
              totalRows: parsedRows.length,
              mergedRows: parsedRows.length,
              duplicateRows: 0,
              timestamp: Date.now(),
            });
            break;
        }

        results.push({
          fileName: file.name,
          type,
          rowsMerged: parsedRows.length,
          totalRows: parsedRows.length,
          error: null,
        });
      } catch (err) {
        results.push({
          fileName: file.name,
          type: 'unknown',
          rowsMerged: 0,
          totalRows: 0,
          error: err instanceof Error ? err.message : 'Failed to process file',
        });
      }
    }

    setResults(results);
    setProcessing(false);

    const errors = results.filter((r) => r.error);
    if (errors.length === results.length) {
      setError('All files failed to process.');
    } else if (errors.length > 0) {
      setError(`${errors.length} file(s) had errors. See details below.`);
    }
  }, [mergeRts, mergeScorecard, mergeCdf, mergeDsb, addUploadSummary]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [processFiles]
  );

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
          title="Upload data files"
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
        <Database className="mx-auto mb-3 h-10 w-10 text-text-faint" />
        <p className="mb-1 text-lg font-medium text-text-subtle">
          Drop CSV files here or click to browse
        </p>
        <p className="text-sm text-text-body">
          Upload RTS, Scorecard, CDF, or DSB files &mdash; type is auto-detected
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-text-faint">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3 w-3" />
            <span>Auto-detects file type</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span>Safe multi-file merge</span>
          </div>
        </div>
      </div>

      {/* File results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                  r.error
                    ? 'border-red-500/30 bg-red-950/20'
                    : TYPE_COLORS[r.type].replace('bg-', 'border-')
                }`}
              >
                {r.error ? (
                  <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                )}
                <span className="flex-1 truncate text-text-body" title={r.fileName}>
                  {r.fileName}
                </span>
                {!r.error && (
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[r.type]}`}>
                    {TYPE_LABELS[r.type]}
                  </span>
                )}
                {!r.error && (
                  <span className="text-text-faint">
                    {r.rowsMerged} rows
                  </span>
                )}
                {r.error && <span className="text-red-400/70 text-xs">{r.error}</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {processing && (
        <div className="mt-3 text-center text-sm text-text-faint">Processing files...</div>
      )}
    </motion.div>
  );
}
