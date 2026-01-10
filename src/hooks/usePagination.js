// src/hooks/usePagination.js

import { useState, useCallback } from 'react';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/constants';

/**
 * Custom hook for pagination logic
 */
export function usePagination(initialPage = DEFAULT_PAGE, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const updatePagination = useCallback((paginationData) => {
    if (paginationData) {
      setTotalItems(paginationData.total || 0);
      setTotalPages(paginationData.pages || 0);
      setCurrentPage(paginationData.page || 1);
      if (paginationData.per_page) {
        setPageSize(paginationData.per_page);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotalItems(0);
    setTotalPages(0);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    updatePagination,
    setPageSize,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
