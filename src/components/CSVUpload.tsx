import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { mapCsvHeaders, parseDate, normalizeRTSCode } from '../lib/headerMap';
import type { RTSDataRow } from '../lib/rts/types';

interface CSVUploadProps {
  compact?: boolean;
}

interface ParseResult {
  data: RTSDataRow[];
  warnings: string[];
  fileName: string;
}

type ParsedCsvRow = Record<string, string> & {
  __parsed_extra?: string[];
};

let rowCounter = 0;

function parseSingleCsv(csvText: string, fileName: string): ParseResult {
  const warnings: string[] = [];
  const result = Papa.parse<ParsedCsvRow>(csvText, { header: true, skipEmptyLines: true, worker: false, download: false });

  if (result.errors.length > 0) {
    warnings.push(`${fileName}: ${result.errors.length} parse errors.`);
  }

  const headers = result.meta?.fields || [];
  const mapping = mapCsvHeaders(headers);

  if (Object.keys(mapping).length === 0) {
    warnings.push(`${fileName}: Could not map any CSV headers.`);
    return { data: [], warnings, fileName };
  }

  const rowsWithExtras = result.data.filter(
    row => row.__parsed_extra && row.__parsed_extra.length > 0
  );

  if (rowsWithExtras.length > 0) {
    warnings.push(`${fileName}: ${rowsWithExtras.length} rows have garbled data (missing line breaks).`);
  }

  const data: RTSDataRow[] = result.data.map((row, idx) => {
    const getValue = (key: string): string => {
      const colIdx = mapping[key];
      if (colIdx === undefined) return '';
      const val = row[headers[colIdx]];
      return val != null && typeof val === 'string' ? val : '';
    };
    const globalIdx = rowCounter++;
    return {
      _id: `${fileName}-${idx}-${globalIdx}`,
      deliveryAssociate: getValue('deliveryAssociate'),
      trackingId: getValue('trackingId'),
      transporterId: getValue('transporterId'),
      impactDcr: getValue('impactDcr'),
      rtsCode: normalizeRTSCode(getValue('rtsCode')),
      additionalInformation: getValue('additionalInformation'),
      exemptionReason: getValue('exemptionReason'),
      plannedDeliveryDate: getValue('plannedDeliveryDate'),
      serviceArea: getValue('serviceArea'),
      normalizedDate: parseDate(getValue('plannedDeliveryDate')),
    };
  });

  return { data, warnings, fileName };
}

export default function CSVUpload({ compact = false }: CSVUploadProps) {
  const mergeRows = useRTSStore(s => s.mergeRows);
  const [error, setErrorState] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    setErrorState(null);
    rowCounter = 0;
    const fileArray = Array.from(files).filter(
      f => f.type === 'text/csv' || f.name.endsWith('.csv')
    );

    if (fileArray.length === 0) {
      setErrorState('Please select valid CSV files.');
      return;
    }

    const readFile = (file: File): Promise<ParseResult> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) {
            resolve({ data: [], warnings: [`Failed to read ${file.name}.`], fileName: file.name });
            return;
          }
          resolve(parseSingleCsv(text, file.name));
        };
        reader.onerror = () => {
          resolve({ data: [], warnings: [`Failed to read ${file.name}.`], fileName: file.name });
        };
        reader.readAsText(file);
      });
    };

    Promise.all(fileArray.map(f => readFile(f))).then(results => {
      const allData = results.flatMap(r => r.data);
      const allWarnings = results.flatMap(r => r.warnings);

      if (allData.length === 0) {
        setErrorState('No data rows found in any CSV file.');
        return;
      }

      if (allWarnings.length > 0) {
        setErrorState(allWarnings.join(' '));
      }

      mergeRows(allData);
    });
  }, [mergeRows]);

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
        <p className="mb-1 text-lg font-medium text-text-subtle">Drop CSV files here or click to browse</p>
        <p className="text-sm text-text-body">Upload 1 or more weekly CSV files to merge</p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-faint">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3 w-3" />
            <span>Auto-maps column headers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span>Combines multiple files safely</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
