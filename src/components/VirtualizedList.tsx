// Virtualized List Component for Performance Optimization
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList as VariableList } from 'react-window';
import { IconChevronUp, IconChevronDown, IconSearch, IconFilter } from '@tabler/icons-react';

export interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight?: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  onItemClick?: (item: T, index: number) => void;
  onItemSelect?: (item: T, selected: boolean) => void;
  selectedItems?: Set<string>;
  getItemKey?: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  theme?: any;
  themes?: any;
}

export interface ListItem {
  id: string;
  [key: string]: any;
}

const VirtualizedList = <T extends ListItem>({
  items,
  height,
  itemHeight = 60,
  renderItem,
  searchable = false,
  filterable = false,
  sortable = false,
  onItemClick,
  onItemSelect,
  selectedItems = new Set(),
  getItemKey = (item: T) => item.id,
  loading = false,
  emptyMessage = 'No items found',
  theme,
  themes
}: VirtualizedListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);
  const listRef = useRef<any>(null);

  // Memoized filtered and sorted items
  const processedItems = useMemo(() => {
    let processed = [...items];

    // Apply search
    if (searchTerm) {
      processed = processed.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        processed = processed.filter(item => {
          const itemValue = item[field];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortField) {
      processed.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [items, searchTerm, filters, sortField, sortDirection]);

  // Extract available filter fields
  useEffect(() => {
    if (items.length > 0) {
      const fields = Object.keys(items[0]).filter(key => 
        key !== 'id' && 
        typeof items[0][key] !== 'object' && 
        items[0][key] !== null
      );
      setAvailableFilters(fields);
    }
  }, [items]);

  // Get unique values for a filter field
  const getFilterValues = useCallback((field: string) => {
    const values = new Set(items.map(item => item[field]));
    return Array.from(values).filter(value => value !== null && value !== undefined);
  }, [items]);

  // Handle item click
  const handleItemClick = useCallback((item: T, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [onItemClick]);

  // Handle item selection
  const handleItemSelect = useCallback((item: T, selected: boolean) => {
    if (onItemSelect) {
      onItemSelect(item, selected);
    }
  }, [onItemSelect]);

  // Scroll to item
  const scrollToItem = useCallback((index: number) => {
    if (listRef.current) {
      listRef.current.scrollToItem(index, 'center');
    }
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(processedItems.length - 1);
    }
  }, [processedItems.length]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Handle filter change
  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setSortField('');
  }, []);

  // Render item wrapper
  const renderItemWrapper = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = processedItems[index];
    if (!item) return null;

    const isSelected = selectedItems.has(getItemKey(item));
    
    return (
      <div
        style={{
          ...style,
          cursor: onItemClick ? 'pointer' : 'default',
          backgroundColor: isSelected ? themes?.[theme]?.primary + '20' : 'transparent',
          borderBottom: '1px solid #eee'
        }}
        onClick={() => handleItemClick(item, index)}
        onDoubleClick={() => handleItemSelect(item, !isSelected)}
      >
        {renderItem(item, index, style)}
      </div>
    );
  }, [processedItems, selectedItems, getItemKey, onItemClick, handleItemClick, handleItemSelect, renderItem, theme, themes]);

  // Get item size for variable height lists
  const getItemSize = useCallback((index: number) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // Loading state
  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2em', marginBottom: 8 }}>Loading...</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Please wait while we fetch your data</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (processedItems.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2em', marginBottom: 8 }}>No items found</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            {searchTerm || Object.keys(filters).length > 0 
              ? 'Try adjusting your search or filters'
              : emptyMessage
            }
          </div>
          {(searchTerm || Object.keys(filters).length > 0) && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                background: themes?.[theme]?.primary || '#007acc',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      {/* Search and Filter Bar */}
      {(searchable || filterable || sortable) && (
        <div style={{
          padding: 12,
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          {/* Search */}
          {searchable && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ position: 'relative' }}>
                <IconSearch
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 32px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: '0.9em'
                  }}
                />
              </div>
            </div>
          )}

          {/* Filters */}
          {filterable && availableFilters.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableFilters.slice(0, 3).map(field => (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconFilter size={14} />
                    <select
                      value={filters[field] || ''}
                      onChange={(e) => handleFilterChange(field, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: '0.8em'
                      }}
                    >
                      <option value="">All {field}</option>
                      {getFilterValues(field).map(value => (
                        <option key={value} value={value}>
                          {String(value)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          {sortable && availableFilters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8em', color: '#666' }}>Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => handleSort(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: '0.8em'
                }}
              >
                <option value="">None</option>
                {availableFilters.map(field => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
              </select>
              {sortField && (
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {sortDirection === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Info */}
      <div style={{
        padding: '8px 12px',
        fontSize: '0.8em',
        color: '#666',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        Showing {processedItems.length} of {items.length} items
        {(searchTerm || Object.keys(filters).length > 0) && (
          <button
            onClick={clearFilters}
            style={{
              marginLeft: 8,
              padding: '2px 6px',
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: 3,
              fontSize: '0.7em',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Virtualized List */}
      <div style={{ height: height - (searchable || filterable || sortable ? 120 : 40) }}>
        {typeof itemHeight === 'function' ? (
          <VariableList
            ref={listRef}
            height={height - (searchable || filterable || sortable ? 120 : 40)}
            itemCount={processedItems.length}
            itemSize={getItemSize}
            itemData={processedItems}
          >
            {renderItemWrapper}
          </VariableList>
        ) : (
          <List
            ref={listRef}
            height={height - (searchable || filterable || sortable ? 120 : 40)}
            itemCount={processedItems.length}
            itemSize={itemHeight}
            itemData={processedItems}
          >
            {renderItemWrapper}
          </List>
        )}
      </div>

      {/* Scroll Controls */}
      <div style={{
        padding: 8,
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        borderTop: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <button
          onClick={scrollToTop}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
        >
          Top
        </button>
        <button
          onClick={scrollToBottom}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: '0.8em'
          }}
        >
          Bottom
        </button>
      </div>
    </div>
  );
};

export default VirtualizedList; 