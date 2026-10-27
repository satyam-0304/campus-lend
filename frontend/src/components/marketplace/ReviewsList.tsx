import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import type { Review } from '@/lib/types';

interface ReviewsListProps {
  reviews: Review[];
  avgRating?: number;
  reviewCount?: number;
}

export function ReviewsList({ reviews, avgRating, reviewCount }: ReviewsListProps) {
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-black text-lg">
            ★ {avgRating && avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Student Reviews & Ratings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {reviewCount && reviewCount > 0
                ? `${reviewCount} verified review${reviewCount !== 1 ? 's' : ''}`
                : 'No reviews yet for this listing'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
          <ShieldCheck size={14} /> 100% Verified PEC Borrowers
        </div>
      </div>

      {/* Reviews Cards List */}
      {reviews.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {reviews.map((rev) => (
            <div
              key={rev.review_id}
              className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[11px] font-extrabold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {rev.reviewer?.full_name ? rev.reviewer.full_name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {rev.reviewer?.full_name || 'Anonymous Student'}
                    </span>
                    {rev.reviewer?.branch && (
                      <span className="ml-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        ({rev.reviewer.branch})
                      </span>
                    )}
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={
                        star <= rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800'
                      }
                    />
                  ))}
                </div>
              </div>

              {rev.comment && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                  "{rev.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-1.5">
          <MessageSquare size={24} className="stroke-1 text-slate-300 dark:text-slate-600" />
          <span>No student reviews yet. Be the first to review after a completed rental or purchase!</span>
        </div>
      )}
    </div>
  );
}
