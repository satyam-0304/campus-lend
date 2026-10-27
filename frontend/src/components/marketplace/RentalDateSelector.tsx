import { Calendar, Clock, IndianRupee, Info } from 'lucide-react';
import { useMemo } from 'react';

interface RentalDateSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  ratePerDay?: number | null;
  ratePerMonth?: number | null;
  ratePerSemester?: number | null;
  priceNote?: string | null;
}

export function RentalDateSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  ratePerDay,
  ratePerMonth,
  ratePerSemester,
  priceNote,
}: RentalDateSelectorProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute duration in days
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end
    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  // Compute best tiered price
  const estimatedCost = useMemo(() => {
    if (durationDays === 0) return null;

    // 1. If semester rate exists and duration >= 100 days
    if (ratePerSemester && durationDays >= 100) {
      const semesters = Math.ceil(durationDays / 120);
      return semesters * ratePerSemester;
    }

    // 2. If month rate exists and duration >= 25 days
    if (ratePerMonth && durationDays >= 25) {
      const months = Math.floor(durationDays / 30);
      const remainingDays = durationDays % 30;
      const dayRate = ratePerDay ?? Math.round(ratePerMonth / 30);
      return months * ratePerMonth + remainingDays * dayRate;
    }

    // 3. Daily rate
    if (ratePerDay) {
      return durationDays * ratePerDay;
    }

    // 4. Monthly fallback
    if (ratePerMonth) {
      const dayEquivalent = ratePerMonth / 30;
      return Math.round(durationDays * dayEquivalent);
    }

    return null;
  }, [durationDays, ratePerDay, ratePerMonth, ratePerSemester]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          <Calendar size={14} className="text-teal-600 dark:text-teal-400" />
          <span>Select Rental Period</span>
        </div>
        {durationDays > 0 && (
          <span className="rounded-full bg-teal-100 dark:bg-teal-950/70 px-2.5 py-0.5 text-xs font-black text-teal-800 dark:text-teal-300">
            {durationDays} {durationDays === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      {/* Date Pickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Pick-up Date
          </label>
          <input
            type="date"
            min={todayStr}
            value={startDate}
            onChange={(e) => {
              onStartDateChange(e.target.value);
              // Auto-adjust end date if needed
              if (endDate && new Date(e.target.value) > new Date(endDate)) {
                onEndDateChange(e.target.value);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Return Date
          </label>
          <input
            type="date"
            min={startDate || todayStr}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Live Calculation Summary */}
      {durationDays > 0 ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Rental Cost:</span>
            <span className="text-base font-black text-slate-900 dark:text-white flex items-center">
              <IndianRupee size={15} />
              {estimatedCost !== null ? estimatedCost : priceNote || 'Flexible / Agree on chat'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Info size={12} className="text-teal-600" />
              Security Deposit:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0 (PEC Trust Model)</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Choose pick-up and return dates to calculate the rental price.
        </p>
      )}
    </div>
  );
}
