import { List } from 'react-window';
import { useMemo, useState, useEffect } from 'react';

interface Column<T> {
  key: string;
  header: string;
  width: number;
  render?: (item: T, index: number) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  rowHeight?: number;
  darkMode?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

/**
 * VirtualizedTable - A high-performance table component using virtual scrolling
 * Only renders visible rows, making it efficient for large datasets
 */
function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  rowHeight = 50,
  darkMode = false,
  onRowClick,
}: VirtualizedTableProps<T>) {
  const [containerWidth, setContainerWidth] = useState(800);
  
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('[data-virtualized-container]');
      if (container) {
        setContainerWidth(container.clientWidth);
      } else {
        // Fallback: use total column width or window width
        setContainerWidth(Math.max(totalWidth, window.innerWidth - 100));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [totalWidth]);

  // Row component for virtual scrolling (react-window v2 API)
  const RowComponent = ({ index, style, ...ariaAttributes }: { 
    index: number; 
    style: React.CSSProperties;
    ariaAttributes?: any;
  }) => {
    const item = data[index];
    const isEven = index % 2 === 0;

    return (
      <div
        style={style}
        onClick={() => onRowClick?.(item, index)}
        className={`flex items-center border-b transition-colors ${
          darkMode
            ? `border-gray-700 ${isEven ? 'bg-gray-800/30' : 'bg-gray-800/50'} hover:bg-gray-700/50`
            : `border-gray-200 ${isEven ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`
        } ${onRowClick ? 'cursor-pointer' : ''}`}
        {...ariaAttributes}
      >
        {columns.map((column, colIndex) => (
          <div
            key={column.key}
            style={{ width: column.width, minWidth: column.width }}
            className={`px-4 py-2 text-sm ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            } ${colIndex === 0 ? 'font-medium' : ''}`}
          >
            {column.render
              ? column.render(item, index)
              : String(item[column.key] || '')}
          </div>
        ))}
      </div>
    );
  };

  // Header component
  const Header = () => (
    <div
      className={`flex items-center border-b-2 font-semibold sticky top-0 z-10 ${
        darkMode
          ? 'bg-gray-800 border-gray-700 text-gray-200'
          : 'bg-gray-100 border-gray-300 text-gray-800'
      }`}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          style={{ width: column.width, minWidth: column.width }}
          className="px-4 py-3 text-sm"
        >
          {column.header}
        </div>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 rounded-xl ${
          darkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'
        }`}
      >
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div
      data-virtualized-container
      className={`rounded-xl overflow-hidden border ${
        darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white'
      }`}
    >
      <Header />
      <div className="overflow-x-auto">
        <List
          rowCount={data.length}
          rowHeight={rowHeight}
          rowComponent={RowComponent}
          rowProps={{}}
          style={{ height, width: Math.max(totalWidth, containerWidth) }}
          className="scrollbar-thin"
        />
      </div>
    </div>
  );
}

export default VirtualizedTable;

