'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Loader2, X, Check } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
}

interface InfiniteSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  options?: SelectOption[];
  fetchOptions?: (query: string, page: number) => Promise<{ options: SelectOption[]; hasMore: boolean }>;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InfiniteSelect: React.FC<InfiniteSelectProps> = ({
  label,
  placeholder = 'Select an option...',
  value,
  onChange,
  options = [],
  fetchOptions,
  className = '',
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<SelectOption[]>(options);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync static options if provided
  useEffect(() => {
    if (!fetchOptions && options) {
      setItems(options);
    }
  }, [options, fetchOptions]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch paginated options
  const loadOptions = useCallback(
    async (query: string, pageNum: number, isNewSearch: boolean = false) => {
      if (!fetchOptions || isLoading) return;
      setIsLoading(true);
      try {
        const res = await fetchOptions(query, pageNum);
        if (isNewSearch) {
          setItems(res.options);
        } else {
          setItems((prev) => [...prev, ...res.options]);
        }
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('Error fetching options:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchOptions, isLoading]
  );

  // Trigger search fetch
  useEffect(() => {
    if (fetchOptions && isOpen) {
      setPage(1);
      const timer = setTimeout(() => {
        loadOptions(searchQuery, 1, true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isOpen]);

  // Handle dropdown scroll to load more
  const handleScroll = () => {
    if (!listRef.current || !fetchOptions || !hasMore || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 30) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOptions(searchQuery, nextPage, false);
    }
  };

  // Filter static options
  const filteredItems = fetchOptions
    ? items
    : items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const selectedItem = items.find((item) => item.value === value) || options.find((item) => item.value === value);

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
            isOpen
              ? 'border-susrutha-brand ring-2 ring-susrutha-brand/20 bg-card text-foreground'
              : 'border-border bg-card text-foreground hover:border-slate-400 dark:hover:border-slate-600'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-muted' : 'cursor-pointer'}`}
        >
          <span className="truncate">
            {selectedItem ? (
              <span className="flex items-baseline space-x-2">
                <span>{selectedItem.label}</span>
                {selectedItem.sublabel && (
                  <span className="text-xs text-muted-foreground font-normal">({selectedItem.sublabel})</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Box */}
            <div className="p-2 border-b border-border flex items-center space-x-2 bg-muted/30">
              <Search className="h-4 w-4 text-muted-foreground ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full bg-transparent py-1 text-xs font-medium text-foreground focus:outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div ref={listRef} onScroll={handleScroll} className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {filteredItems.length === 0 && !isLoading ? (
                <div className="p-3 text-center text-xs text-muted-foreground font-medium">No items found</div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.value === value;
                  return (
                    <div
                      key={item.value}
                      onClick={() => {
                        onChange(item.value, item);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-susrutha-brand/10 text-susrutha-brand font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.sublabel && <span className="text-[11px] text-muted-foreground">{item.sublabel}</span>}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-susrutha-brand" />}
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center justify-center p-2 text-xs text-susrutha-brand space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading options...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
