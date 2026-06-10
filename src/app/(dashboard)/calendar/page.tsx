'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  MapPin,
  Scale,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

interface CaseInfo {
  id: string;
  caseNumber: string;
  partyName: string;
  courtCategory: string;
  courtName: string;
}

interface Hearing {
  id: string;
  hearingDate: string;
  nextHearingDate: string | null;
  courtRemarks: string | null;
  lawyerNotes: string | null;
  eventType: string;
  case: CaseInfo;
}

export default function CalendarPage() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchHearings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hearings');
      if (res.ok) {
        const data = await res.json();
        setHearings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Helper: Get hearings on a specific calendar day
  const getHearingsForDate = (day: number) => {
    const compareDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return hearings.filter((h) => {
      const hDate = new Date(h.hearingDate);
      return (
        hDate.getFullYear() === compareDate.getFullYear() &&
        hDate.getMonth() === compareDate.getMonth() &&
        hDate.getDate() === compareDate.getDate()
      );
    });
  };

  // Render variables
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Selected date hearings list
  const selectedDateHearings = hearings.filter((h) => {
    const hDate = new Date(h.hearingDate);
    return isSameDay(hDate, selectedDate);
  });

  const calendarDays = [];
  // Add empty slots for days of prev month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-amber-500" />
            Chamber Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Schedule of Supreme Court advocacy hearings, filing deadlines, and client meetings.
          </p>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white transition-all cursor-pointer shrink-0"
        >
          Go to Today
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900 border border-slate-850 rounded-2xl">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing calendar records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Calendar Grid card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white tracking-wide">
                {monthName} {currentYear}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-slate-800 bg-slate-950/40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-slate-800 bg-slate-950/40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {weekdays.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-slate-950/10 rounded-xl" />;
                }

                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isSelected = isSameDay(dateObj, selectedDate);
                const isToday = isSameDay(dateObj, new Date());
                const dayHearings = getHearingsForDate(day);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`aspect-square p-2.5 rounded-xl border flex flex-col justify-between items-start transition-all relative cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : isToday
                        ? 'bg-slate-950 border-amber-500/20 text-white font-extrabold'
                        : 'bg-slate-950/50 border-slate-850 hover:border-slate-800 text-slate-350 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold">{day}</span>
                    
                    {dayHearings.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-amber-400' : 'bg-amber-500'
                        }`} />
                        {dayHearings.length > 1 && (
                          <span className="text-[8px] leading-none font-bold text-slate-500 group-hover:text-slate-300">
                            +{dayHearings.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day hearings details */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Hearings Summary
              </h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5 uppercase">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {selectedDateHearings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-xl">
                <Clock className="h-8 w-8 text-slate-700 mb-2.5" />
                <p className="text-xs font-bold text-slate-400">No events scheduled</p>
                <p className="text-[10px] text-slate-500 mt-1">No hearings or filings found on this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateHearings.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition-all relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 text-[8px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-bl bg-amber-500/10 text-amber-400 border-l border-b border-amber-500/20">
                      {h.eventType}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/cases/${h.case.id}`}
                          className="text-xs font-extrabold text-white hover:text-amber-400 hover:underline truncate"
                        >
                          {h.case.caseNumber}
                        </Link>
                        <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-slate-400 border border-slate-700/50 uppercase">
                          {h.case.courtCategory}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold text-slate-350 leading-relaxed">
                        {h.case.partyName}
                      </p>

                      <div className="space-y-1 pt-1.5 border-t border-slate-850/60 text-[10px] font-semibold text-slate-450">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Time: {new Date(h.hearingDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate" title={h.courtRemarks || h.case.courtName}>
                            Court: {h.courtRemarks || h.case.courtName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
