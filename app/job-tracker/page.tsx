'use client';

import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';

export default function JobTrackerPage() {
  const {
    trackedJobs,
    moveTrackedJob,
  } = useApp();

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); 

  const [rangeStart, setRangeStart] = useState<string | null>('2026-05-20');
  const [rangeEnd, setRangeEnd] = useState<string | null>('2026-06-01');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);

  const daysArray = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const remainingCells = 42 - daysArray.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const handleDateClick = (dateString: string) => {
    if ((rangeStart && rangeEnd) || (!rangeStart && !rangeEnd)) {
      setRangeStart(dateString);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (dateString >= rangeStart) {
        setRangeEnd(dateString);
      } else {
        setRangeEnd(rangeStart);
        setRangeStart(dateString);
      }
    }
  };

  const isSelected = (dateString: string) => {
    if (dateString === rangeStart || dateString === rangeEnd) {
      return 'endpoints';
    }
    if (rangeStart && rangeEnd && dateString > rangeStart && dateString < rangeEnd) {
      return 'inbetween';
    }
    return 'none';
  };

  const clearDateFilter = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  const columnData = [
    { title: 'WISHLIST', status: 'wishlist' as const, color: 'bg-purple-400' },
    { title: 'APPLIED', status: 'applied' as const, color: 'bg-indigo-400' },
    { title: 'INTERVIEWING', status: 'interviewing' as const, color: 'bg-blue-400' },
    { title: 'OFFERED', status: 'offered' as const, color: 'bg-emerald-400' },
    { title: 'REJECTED', status: 'rejected' as const, color: 'bg-rose-400' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header title="Tracker Dashboard" subtitle="Track application stages clearly" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 grid grid-cols-5 gap-3">
          {columnData.map((column) => {
            const columnJobs = trackedJobs.filter((j) => j.status === column.status);

            return (
              <div
                key={column.status}
                className="bg-white rounded-[28px] p-4 shadow-sm border border-gray-100/50 flex flex-col min-h-[500px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) moveTrackedJob(id, column.status);
                }}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${column.color}`} />
                    <h3 className="font-extrabold text-[10px] text-gray-700 tracking-wider truncate">{column.title}</h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                    {columnJobs.length}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {columnJobs.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <span className="text-xs font-bold text-gray-300">Stage Empty</span>
                    </div>
                  ) : (
                    columnJobs.map((job) => (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', job.id)}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs cursor-grab active:cursor-grabbing hover:border-gray-200 transition-colors"
                      >
                        <h4 className="font-extrabold text-xs text-[#1a253c] mb-1">{job.title}</h4>
                        <p className="text-[10px] font-bold text-gray-400 mb-3">{job.company}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {columnData.map(
                            (c) =>
                              c.status !== column.status && (
                                <button
                                  key={c.status}
                                  onClick={() => moveTrackedJob(job.id, c.status)}
                                  className="text-[8px] font-black bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md hover:bg-gray-100 text-gray-500 uppercase tracking-wider"
                                >
                                  {c.status.slice(0, 3)}
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100/50">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Calendar Scope</h3>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-[#1a253c] text-base">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <div className="flex gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-xs font-bold cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={handleNextMonth}
                className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-xs font-bold cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-0.5 text-center mb-4">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <div key={day} className="text-[9px] font-extrabold text-gray-400 tracking-wider">
                {day}
              </div>
            ))}
            {daysArray.map((cell, idx) => {
              const selectState = isSelected(cell.dateString);
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(cell.dateString)}
                  className={`text-center py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    selectState === 'endpoints'
                      ? 'bg-[#9ef01a] text-black font-extrabold shadow-sm'
                      : selectState === 'inbetween'
                      ? 'bg-[#9ef01a]/20 text-[#121315] font-bold'
                      : cell.isCurrentMonth
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <button
            onClick={clearDateFilter}
            className="w-full text-center text-[10px] font-extrabold text-gray-400 hover:text-black uppercase tracking-wider transition-colors pt-2 border-t border-gray-50"
          >
            Clear Date Filter
          </button>
        </div>
      </div>
    </div>
  );
}
