'use client';

import { useState, useMemo, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  Box,
  InputAdornment,
  Toolbar,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export interface Column<T> {
  id: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  getValue?: (row: T) => any;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  keyExtractor: (row: T) => string;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  searchPlaceholder?: string;
  enableSearch?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  toolbarActions?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  title,
  keyExtractor,
  defaultSortBy,
  defaultSortOrder = 'asc',
  searchPlaceholder = 'Search...',
  enableSearch = true,
  emptyMessage = 'No data available',
  loading = false,
  toolbarActions,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>(defaultSortBy || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRequestSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      return columns.some((column) => {
        if (!column.filterable) return false;
        
        const value = column.getValue 
          ? column.getValue(row)
          : (row as any)[column.id];
        
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, columns]);

  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;

    const column = columns.find((col) => col.id === orderBy);
    if (!column || !column.sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = column.getValue 
        ? column.getValue(a)
        : (a as any)[orderBy];
      const bValue = column.getValue 
        ? column.getValue(b)
        : (b as any)[orderBy];

      if (aValue == null) return order === 'asc' ? 1 : -1;
      if (bValue == null) return order === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, orderBy, order, columns]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  return (
    <Paper>
      {(title || enableSearch || toolbarActions) && (
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          {title && (
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
            {enableSearch && (
              <TextField
                size="small"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            {toolbarActions}
          </Box>
        </Toolbar>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={keyExtractor(row)} hover>
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.render 
                        ? column.render(row)
                        : String((row as any)[column.id] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={sortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
}
