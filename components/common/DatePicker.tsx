// components/common/DatePicker.tsx
import '../../types';
import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';

interface DatePickerProps {
  label: string;
  name?: string;
  value: string; // yyyy-mm-dd
  onChange: (date: string) => void;
  min?: string; // yyyy-mm-dd
  max?: string; // yyyy-mm-dd
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, name, value, onChange, min, max }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = min ? new Date(`${min}T00:00:00`) : null;
    const maxDate = max ? new Date(`${max}T00:00:00`) : null;

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: numDays }, (_, i) => i + 1);

    return (
      <div className="absolute top-full mt-2 w-72 bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl p-4 z-10 animate-scale-up origin-top-left">
        <div className="flex justify-between items-center mb-4">
          {/* FIX: Changed 'class' to 'className' for ion-icon component to align with React standards. */}
          <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700"><ion-icon name="chevron-back-outline" className=""></ion-icon></button>
          <span className="font-semibold text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          {/* FIX: Changed 'class' to 'className' for ion-icon component to align with React standards. */}
          <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700"><ion-icon name="chevron-forward-outline" className=""></ion-icon></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
          {days.map(day => {
            const date = new Date(year, month, day);
            const isSelected = value && date.getTime() === selectedDate.getTime();
            const isToday = date.getTime() === today.getTime();
            const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
            
            const classes = [
              'w-8 h-8 flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors',
              isDisabled ? 'text-gray-600 cursor-not-allowed' : 'hover:bg-gray-700 text-gray-200',
              isSelected && 'bg-blue-600 !text-white font-bold',
              !isSelected && isToday && 'border-2 border-gray-500',
            ].join(' ');

            return (
              <button type="button" key={day} onClick={() => !isDisabled && handleDateSelect(day)} className={classes} disabled={isDisabled}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  const formattedValue = value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <div className="relative">
        <input
            type="text"
            name={name}
            readOnly
            value={formattedValue}
            onClick={() => setIsOpen(!isOpen)}
            placeholder="Select a date"
            className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3 cursor-pointer"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {/* FIX: Changed 'class' to 'className' for ion-icon component to align with React standards. */}
            <ion-icon name="calendar-outline" className="text-gray-400"></ion-icon>
        </div>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
};