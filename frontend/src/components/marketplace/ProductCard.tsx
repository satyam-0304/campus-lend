import {
  Clock,
  Compass,
  Laptop,
  BookOpen,
  Sparkles,
  Tag,
  IndianRupee,
  ShieldCheck,
  Star,
  Eye,
  ZoomIn,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import type { Category, EquipmentWithOwner, RequestStatus } from '@/lib/types';

const categoryLabels: Record<Category, string> = {
  academics: 'Academics',
  electronics: 'Electronics',
  sports: 'Sports',
  event_wear: 'Event wear',
};

interface ProductCardProps {
  item: EquipmentWithOwner;
  isOwn: boolean;
  requestEntry?: { status: RequestStatus; requestId: string };
  onOpenDetails: (item: EquipmentWithOwner) => void;
  onCancelRequest: (item: EquipmentWithOwner) => void;
}

export function ProductCard({
  item,
  isOwn,
  requestEntry,
  onOpenDetails,
  onCancelRequest,
}: ProductCardProps) {
  const requestStatus = requestEntry?.status;
  const isSell = item.listing_type === 'sell';
  const hasBack = Boolean(item.image_back_url);
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');

  const activeImg = activeView === 'front' ? item.image_url : (item.image_back_url || item.image_url);

  // Fallback category icon
  const CategoryIcon =
    item.category === 'electronics'
      ? Laptop
      : item.category === 'academics'
      ? BookOpen
      : item.category === 'sports'
      ? Compass
      : Sparkles;

  const isAvailable = item.status === 'available' && (item.quantity ?? 1) > 0;
  const locationText = item.owner?.hostel_name
    ? `${item.owner.hostel_name}${item.owner.room_number ? ` · Room ${item.owner.room_number}` : ''}`
    : item.owner?.room_number
    ? `Room ${item.owner.room_number}`
    : 'Campus resident';

  return (
    <article
      onClick={() => onOpenDetails(item)}
      className="group relative flex flex-col rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 dark:hover:border-sky-500/40 dark:hover:shadow-black/50 cursor-pointer overflow-hidden"
    >
      {/* ── Media Container ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60">
        {activeImg ? (
          <img
            src={activeImg}
            alt={`${item.equipment_name} ${activeView} view`}
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
            <CategoryIcon size={44} className="stroke-1" />
          </div>
        )}

        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Listing Type Pill */}
          {isSell ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/95 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm shadow-violet-900/30">
              <Tag size={12} className="stroke-[2.5]" />
              For Sale
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/95 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm shadow-teal-900/30">
              <Clock size={12} className="stroke-[2.5]" />
              For Rent
            </span>
          )}

          {/* Stock / Availability Badge */}
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {item.quantity && item.quantity > 1 ? `${item.quantity} in stock` : 'Available'}
            </span>
          ) : (
            <span className="rounded-full bg-rose-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              Out of stock
            </span>
          )}
        </div>

        {/* Front / Back Switcher (only if back photo exists) */}
        {hasBack && item.image_url && (
          <div
            className="absolute bottom-3 left-3 z-10 flex items-center rounded-full bg-black/60 backdrop-blur-md p-0.5 gap-0.5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveView('front')}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                activeView === 'front'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setActiveView('back')}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                activeView === 'back'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Back
            </button>
          </div>
        )}

        {/* Quick Inspect Zoom Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          <ZoomIn size={12} /> Inspect
        </div>
      </div>

      {/* ── Content Container ── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Rating Row */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 text-[11px]">
            {categoryLabels[item.category] || item.category}
          </span>

          {/* Star Rating snippet */}
          <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{item.avg_rating && item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}</span>
            {item.review_count && item.review_count > 0 ? (
              <span className="text-[10px] font-medium text-amber-600/70 dark:text-amber-400/60">
                ({item.review_count})
              </span>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {item.equipment_name}
        </h3>

        {/* Pricing Display */}
        <div className="mt-2.5">
          {isSell ? (
            <div className="flex items-baseline gap-2">
              <span className="flex items-center text-xl font-black text-slate-900 dark:text-white">
                <IndianRupee size={18} className="stroke-[2.5]" />
                {item.sale_price != null ? item.sale_price : item.price_note || 'Negotiable'}
              </span>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                Buy now
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.rate_per_day != null && (
                <span className="inline-flex items-center rounded-lg border border-teal-200/80 bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/50 dark:text-teal-300">
                  ₹{item.rate_per_day}
                  <span className="ml-0.5 text-[10px] font-normal text-teal-600 dark:text-teal-400">/day</span>
                </span>
              )}
              {item.rate_per_month != null && (
                <span className="inline-flex items-center rounded-lg border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
                  ₹{item.rate_per_month}
                  <span className="ml-0.5 text-[10px] font-normal text-sky-600 dark:text-sky-400">/mo</span>
                </span>
              )}
              {item.rate_per_semester != null && (
                <span className="inline-flex items-center rounded-lg border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
                  ₹{item.rate_per_semester}
                  <span className="ml-0.5 text-[10px] font-normal text-indigo-600 dark:text-indigo-400">/sem</span>
                </span>
              )}
              {item.rate_per_day == null && item.rate_per_month == null && item.rate_per_semester == null && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.price_note || 'Flexible rates'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Verified Owner Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
              {item.owner?.full_name || 'PEC Student'}
            </span>
            <ShieldCheck size={14} className="text-sky-500 shrink-0" title="Verified PEC Student" />
          </div>
          <span className="truncate text-[11px] text-slate-400 dark:text-slate-500 max-w-[45%] text-right">
            {locationText}
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {isOwn ? (
            <div className="w-full rounded-2xl bg-slate-100 py-2.5 text-center text-xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Your Listing
            </div>
          ) : requestStatus === 'pending' ? (
            <div className="flex gap-2">
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-amber-50 py-2.5 text-xs font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                Request Sent
              </div>
              <button
                type="button"
                onClick={() => onCancelRequest(item)}
                className="flex items-center justify-center gap-1 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
                title="Cancel request"
              >
                <XCircle size={15} /> Cancel
              </button>
            </div>
          ) : requestStatus === 'approved' || requestStatus === 'active' ? (
            <div className="w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/30 py-2.5 text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              Request Approved ✓
            </div>
          ) : (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onOpenDetails(item)}
              className={`group/btn flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-extrabold text-white transition-all shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${
                isSell
                  ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
              }`}
            >
              <span>{isSell ? 'View & Buy' : 'View & Rent'}</span>
              <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
