import { useState } from 'react';
import { Star, X, Check, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  equipmentId: string;
  equipmentName: string;
  onSuccess: (msg: string) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  requestId,
  equipmentId,
  equipmentName,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.createReview({
        request_id: requestId,
        equipment_id: equipmentId,
        rating,
        comment: comment.trim(),
      });
      onSuccess('Thank you for rating your peer! ★');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review. You may have already reviewed this item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Rate Your Experience
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
            {equipmentName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your review helps build trust across the PEC student community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex flex-col items-center justify-center py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || rating);
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={
                        isFilled
                          ? 'fill-amber-400 text-amber-400 transition-colors'
                          : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700 transition-colors'
                      }
                    />
                  </button>
                );
              })}
            </div>
            <span className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {rating === 5
                ? 'Excellent (5/5)'
                : rating === 4
                ? 'Very Good (4/5)'
                : rating === 3
                ? 'Good (3/5)'
                : rating === 2
                ? 'Fair (2/5)'
                : 'Poor (1/5)'}
            </span>
          </div>

          {/* Feedback textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Feedback / Item Condition Note (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the item in great condition? Was the handover on time?"
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-2.5 px-4 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}
