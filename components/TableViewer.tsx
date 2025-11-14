'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Filter, Download, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

type TableName = 'Signals' | 'Orders' | 'Trades' | 'Pnl';

// Map table names to their date columns
const tableDateColumns: Record<TableName, string> = {
  'Signals': 'date',
  'Orders': 'date',
  'Trades': 'date',
  'Pnl': 'sell_date'
};

// Map table names to their ID columns for ordering
const tableIdColumns: Record<TableName, string> = {
  'Signals': 'signalId',
  'Orders': 'orderId',
  'Trades': 'tradeId',
  'Pnl': 'pnlId'
};

export default function TableViewer() {
  const [selectedTable, setSelectedTable] = useState<TableName>('Signals');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const tables: TableName[] = ['Signals', 'Orders', 'Trades', 'Pnl'];

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from(selectedTable)
        .select('*', { count: 'exact' });

      // Apply date filter using the correct date column for each table
      const dateColumn = tableDateColumns[selectedTable];
      if (dateFilter.from && dateColumn) {
        query = query.gte(dateColumn, dateFilter.from);
      }
      if (dateFilter.to && dateColumn) {
        query = query.lte(dateColumn, dateFilter.to);
      }

      // Apply column filters
      Object.entries(columnFilters).forEach(([column, value]) => {
        if (value) {
          query = query.ilike(column, `%${value}%`);
        }
      });

      // Apply pagination and ordering
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Use sortColumn if set, otherwise use default ID column
      const orderColumn = sortColumn || tableIdColumns[selectedTable];
      const ascending = sortColumn ? sortDirection === 'asc' : false;
      
      query = query.range(from, to).order(orderColumn, { ascending });

      const { data: fetchedData, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setData(fetchedData || []);
      setTotalCount(count || 0);

      // Extract columns from first row
      if (fetchedData && fetchedData.length > 0) {
        setColumns(Object.keys(fetchedData[0]));
      } else {
        setColumns([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTable, currentPage, dateFilter, columnFilters, sortColumn, sortDirection]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  const handleExport = () => {
    const csv = [
      columns.join(','),
      ...data.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      try {
        return format(new Date(value), 'MMM dd, yyyy HH:mm');
      } catch {
        return value;
      }
    }
    return value.toString();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Table Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value as TableName);
                setCurrentPage(1);
                setColumnFilters({});
                setSortColumn('');
                setSortDirection('desc');
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          {/* Date Filters */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, from: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, to: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            {(dateFilter.from || dateFilter.to) && (
              <button
                onClick={() => {
                  setDateFilter({ from: '', to: '' });
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-destructive/20 text-destructive rounded-md hover:bg-destructive/30 transition-colors text-sm"
              >
                Clear Dates
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={data.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(dateFilter.from || dateFilter.to) && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg text-sm">
          <span className="font-medium">Active Filters:</span>
          {dateFilter.from && <span className="ml-2">From: {dateFilter.from}</span>}
          {dateFilter.to && <span className="ml-2">To: {dateFilter.to}</span>}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.map(column => (
                  <th key={column} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-2 hover:text-foreground transition-colors w-full text-left group"
                      >
                        <span>{column}</span>
                        <span className="group-hover:opacity-100 transition-opacity">
                          {getSortIcon(column)}
                        </span>
                      </button>
                      {showFilters && (
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters[column] || ''}
                          onChange={(e) => handleColumnFilterChange(column, e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    {columns.map(column => (
                      <td key={column} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
