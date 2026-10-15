import React from 'react';
import { Spinner } from './Spinner';
import { Button } from './Button';

export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortBy?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  pagination,
  sorting,
  toolbar,
}: DataTableProps<T>) {
  const handleSortClick = (col: Column<T>) => {
    if (!col.sortable || !sorting) return;
    const sortField = col.sortBy ?? col.id;
    sorting.onSort(sortField);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {toolbar && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e9ecef',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {toolbar}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
              {columns.map((col) => {
                const sortField = col.sortBy ?? col.id;
                const isSorted = sorting?.sortBy === sortField;
                const sortDirection = isSorted ? sorting?.sortOrder : undefined;

                return (
                  <th
                    key={col.id}
                    onClick={() => handleSortClick(col)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#495057',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: col.width,
                      textAlign: col.align ?? 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span style={{ fontSize: '0.7rem', color: isSorted ? '#0a0a0a' : '#adb5bd' }}>
                          {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: '#6c757d',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <Spinner size="md" />
                    <span style={{ fontSize: '0.875rem' }}>Loading data…</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: '#adb5bd',
                    fontSize: '0.875rem',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  style={{
                    borderBottom: '1px solid #f1f3f5',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {columns.map((col) => {
                    let cellContent: React.ReactNode;
                    if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(row);
                    } else if (col.accessor) {
                      cellContent = String(row[col.accessor] ?? '');
                    } else {
                      cellContent = null;
                    }

                    return (
                      <td
                        key={col.id}
                        style={{
                          padding: '12px 16px',
                          fontSize: '0.875rem',
                          color: '#212529',
                          textAlign: col.align ?? 'left',
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid #dee2e6',
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#6c757d' }}>
            <span>
              Showing {data.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </span>
            {pagination.onLimitChange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>Rows:</span>
                <select
                  aria-label="Rows per page"
                  value={pagination.limit}
                  onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '0.8125rem',
                    background: '#ffffff',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
