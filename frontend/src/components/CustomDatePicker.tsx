import { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  darkMode = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [openUpward, setOpenUpward] = useState(false);

  const selectedDate = value ? new Date(value) : null;

  // Check available space for positioning
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const calendarHeight = 350; // Approximate calendar height

      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = newDate.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div ref={datePickerRef} className={`relative ${className}`}>
      {/* Date Input Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-3 pl-14 ${value ? 'pr-10' : 'pr-5'} rounded-xl border-2 text-sm font-bold transition-all duration-300 flex items-center justify-between ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border-indigo-500/50 text-gray-100 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-br from-white to-gray-50/90 backdrop-blur-xl border-indigo-400/60 text-gray-900 hover:border-indigo-500 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-[0_4px_15px_rgba(99,102,241,0.15)]'
        } ${isOpen ? (darkMode ? 'border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)]' : 'border-indigo-500 shadow-[0_4px_25px_rgba(99,102,241,0.4)]') : ''}`}
      >
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
          darkMode ? 'text-indigo-400' : 'text-indigo-600'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className={`truncate ${!value ? (darkMode ? 'text-gray-500' : 'text-gray-400') : ''}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
              darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Clear date"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          className={`absolute z-50 w-[320px] rounded-xl border-2 overflow-hidden shadow-2xl ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border-indigo-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl border-indigo-400/60 shadow-[0_8px_32px_rgba(99,102,241,0.2)]'
          }`}
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Calendar Header */}
          <div className={`p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-700/50 hover:text-indigo-400'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`text-lg font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-700/50 hover:text-indigo-400'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className={`text-xs font-semibold text-center py-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Days */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const isDayToday = isToday(day);
                const isDaySelected = isSelected(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`aspect-square rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isDaySelected
                        ? darkMode
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                        : isDayToday
                          ? darkMode
                            ? 'bg-indigo-500/20 text-indigo-300 border-2 border-indigo-400'
                            : 'bg-indigo-100 text-indigo-700 border-2 border-indigo-400'
                          : darkMode
                            ? 'text-gray-200 hover:bg-gray-700/50 hover:text-indigo-300'
                            : 'text-gray-900 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer - Today Button */}
          <div className={`p-3 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              type="button"
              onClick={handleToday}
              className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                darkMode
                  ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;

