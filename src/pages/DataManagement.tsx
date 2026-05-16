import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  FileSpreadsheet,
  AlertTriangle,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import DataUpload from '../components/DataUpload';
import { useDataSourceStore } from '../store/useDataSourceStore';

const DATA_TYPES = [
  {
    key: 'rts' as const,
    label: 'RTS Data',
    icon: <LayoutDashboard className="h-4 w-4" />,
    color: 'border-blue-500/30 bg-blue-500/10',
    linkTo: '/',
  },
  {
    key: 'scorecard' as const,
    label: 'Scorecard',
    icon: <UserCircle className="h-4 w-4" />,
    color: 'border-emerald-500/30 bg-emerald-500/10',
    linkTo: '/da-performance',
  },
  {
    key: 'cdf' as const,
    label: 'CDF',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    color: 'border-amber-500/30 bg-amber-500/10',
    linkTo: '/cdf-dsb',
  },
  {
    key: 'dsb' as const,
    label: 'DSB',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    color: 'border-purple-500/30 bg-purple-500/10',
    linkTo: '/cdf-dsb',
  },
];

function DataTypeCard({
  type,
}: {
  type: typeof DATA_TYPES[0];
}) {
  const store = useDataSourceStore();
  const rows = store[`${type.key}Rows` as keyof typeof store] as unknown as any[];
  const weeks = store[`${type.key}LoadedWeeks` as keyof typeof store] as unknown as string[];
  const lastUpload = store[`${type.key}LastUpload` as keyof typeof store] as string;
  const clearFn = store[`clear${type.key.charAt(0).toUpperCase() + type.key.slice(1)}` as keyof typeof store] as () => void;

  const hasData = rows.length > 0;

  return (
    <div className={`rounded-lg border p-4 ${type.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {type.icon}
          <span className="font-medium text-text-heading">{type.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <Link
              to={type.linkTo}
              className="text-xs text-text-body hover:text-text-subtle transition-colors"
            >
              View &rarr;
            </Link>
          )}
          {hasData && (
            <button
              onClick={clearFn}
              className="p-1 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title={`Clear ${type.label} data`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {hasData ? (
        <div className="space-y-1">
          <div className="text-sm text-text-body">
            <span className="font-medium text-text-heading">{rows.length}</span> rows loaded
          </div>
          {weeks.length > 0 && (
            <div className="text-xs text-text-faint">
              Weeks: {weeks.join(', ')}
            </div>
          )}
          {lastUpload && (
            <div className="text-xs text-text-faint">
              {lastUpload}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-text-faint">
          <AlertTriangle className="h-3.5 w-3.5" />
          No data uploaded
        </div>
      )}
    </div>
  );
}

export default function DataManagement() {
  const clearAll = useDataSourceStore((s) => s.clearAll);
  const {
    rtsRows,
    scorecardRows,
    cdfRows,
    dsbRows,
  } = useDataSourceStore();

  const totalRows = rtsRows.length + scorecardRows.length + cdfRows.length + dsbRows.length;
  const hasAnyData = totalRows > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Data Management</h1>
          <p className="text-sm text-text-body mt-1">
            Upload all data files here. Each dashboard reads what it needs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasAnyData && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear all uploaded data"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-body hover:text-text-subtle hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to RTS
          </Link>
        </div>
      </div>

      {/* Upload Zone */}
      <DataUpload />

      {/* Data Summary Cards */}
      <div>
        <h2 className="text-sm font-medium text-text-subtle mb-3">Loaded Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DATA_TYPES.map((type) => (
            <DataTypeCard key={type.key} type={type} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-text-subtle mb-3">Dashboards</h2>
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md border border-surface-3 bg-surface-2/50 px-4 py-2 text-sm text-text-body hover:text-text-subtle hover:bg-surface-hover transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            RTS Dashboard
          </Link>
          <Link
            to="/da-performance"
            className="flex items-center gap-2 rounded-md border border-surface-3 bg-surface-2/50 px-4 py-2 text-sm text-text-body hover:text-text-subtle hover:bg-surface-hover transition-colors"
          >
            <UserCircle className="h-4 w-4" />
            DA Performance
          </Link>
          <Link
            to="/cdf-dsb"
            className="flex items-center gap-2 rounded-md border border-surface-3 bg-surface-2/50 px-4 py-2 text-sm text-text-body hover:text-text-subtle hover:bg-surface-hover transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CDF/DSB
          </Link>
        </div>
      </div>
    </div>
  );
}
