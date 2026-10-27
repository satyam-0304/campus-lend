import { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  ShieldCheck,
  Star,
  Clock,
  Tag,
  MessageSquare,
  ZoomIn,
  Check,
  LoaderCircle,
  Building2,
  Minus,
  Plus,
  Info,
  Calendar,
} from 'lucide-react';
import type { EquipmentWithOwner, Profile, Review } from '@/lib/types';
import { RentalDateSelector } from './RentalDateSelector';
import { ReviewsList } from './ReviewsList';
import { api } from '@/lib/api';

interface ProductDetailModalProps {
  item: EquipmentWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onRequest: (payload: {
    item: EquipmentWithOwner;
    quantity: number;
    startDate?: string;
    endDate?: string;
    totalAmount?: number;
    buyerNote?: string;
  }) => Promise<void>;
  onOpenChat: (recipientId: string, recipientName: string, equipmentId: string, equipmentName: string) => void;
}

export function ProductDetailModal({
  item,
  isOpen,
  onClose,
  currentUser,
  onRequest,
  onOpenChat,
}: ProductDetailModalProps) {
  const [activePhoto, setActivePhoto] = useState<'front' | 'back'>('front');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, lightboxOpen, onClose]);

  // Load reviews when item changes
  useEffect(() => {
    if (!isOpen || !item) return;
    setQuantity(1);
    setActivePhoto('front');
    setBuyerNote('');
    setStartDate('');
    setEndDate('');

    setReviewsLoading(true);
    api.getEquipmentReviews(item.equipment_id)
      .then((data) => setReviews(data || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isSell = item.listing_type === 'sell';
  const isOwn = item.owner_id === currentUser.id;
  const hasBack = Boolean(item.image_back_url);
  const currentImg = activePhoto === 'front' ? item.image_url : (item.image_back_url || item.image_url);
  const maxQty = item.quantity || 1;

  // Calculate rental cost
  let calculatedRent = 0;
  if (!isSell && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const days = diff > 0 ? diff : 1;

    if (item.rate_per_semester && days >= 100) {
      calculatedRent = Math.ceil(days / 120) * item.rate_per_semester;
    } else if (item.rate_per_month && days >= 25) {
      const months = Math.floor(days / 30);
      const rem = days % 30;
      calculatedRent = months * item.rate_per_month + rem * (item.rate_per_day || Math.round(item.rate_per_month / 30));
    } else if (item.rate_per_day) {
      calculatedRent = days * item.rate_per_day;
    } else if (item.rate_per_month) {
      calculatedRent = Math.round(days * (item.rate_per_month / 30));
    }
  }

  const finalTotal = isSell
    ? (item.sale_price ? item.sale_price * quantity : 0)
    : calculatedRent;

  const handleSubmitRequest = async () => {
    if (isOwn || submitting) return;
    setSubmitting(true);
    try {
      await onRequest({
        item,
        quantity,
        startDate: !isSell ? startDate : undefined,
        endDate: !isSell ? endDate : undefined,
        totalAmount: finalTotal > 0 ? finalTotal : undefined,
        buyerNote: buyerNote.trim() || undefined,
      });
      onClose();
    } catch {
      // handled by parent toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Lightbox Zoom View */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <span className="font-extrabold text-sm truncate">{item.equipment_name}</span>
              <button
                onClick={() => setLightboxOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center justify-center rounded-3xl overflow-hidden bg-black/40 max-h-[80vh]">
              {currentImg && (
                <img
                  src={currentImg}
                  alt={item.equipment_name}
                  className="max-h-[80vh] w-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative flex flex-col w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar with Close button */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              {isSell ? (
                <span className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-extrabold text-white">
                  <Tag size={12} /> For Sale
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-extrabold text-white">
                  <Clock size={12} /> For Rent
                </span>
              )}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {item.category}
              </span>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Left Column: Image Gallery & Condition */}
              <div className="space-y-4">
                {/* Image View */}
                <div
                  className="relative aspect-[4/3] w-full rounded-3xl bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center cursor-zoom-in border border-slate-200/80 dark:border-slate-800 group"
                  onClick={() => setLightboxOpen(true)}
                >
                  {currentImg ? (
                    <img
                      src={currentImg}
                      alt={item.equipment_name}
                      className="max-h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-400 text-sm">No photo available</div>
                  )}

                  {/* Front/Back toggle pills */}
                  {hasBack && item.image_url && (
                    <div
                      className="absolute bottom-3 left-3 z-10 flex items-center rounded-full bg-black/60 backdrop-blur-md p-0.5 gap-0.5 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setActivePhoto('front')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          activePhoto === 'front' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        Front View
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhoto('back')}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          activePhoto === 'back' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        Back View
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    <ZoomIn size={13} /> Zoom
                  </div>
                </div>

                {/* Campus Safety Notice */}
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-sky-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-extrabold">Campus Handover Protocol:</strong> Meet in trusted PEC common spots (Library lawn, Nescafe, or Hostel Common Room). Test the item condition before paying via UPI.
                  </p>
                </div>
              </div>

              {/* Right Column: Title, Pricing & Interactive Order Box */}
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {item.equipment_name}
                  </h2>

                  {/* Ratings & Stock */}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-amber-700 dark:text-amber-400 font-bold">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>{item.avg_rating && item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}</span>
                      {item.review_count && item.review_count > 0 && (
                        <span className="font-medium text-amber-600/70 dark:text-amber-400/60">
                          ({item.review_count} reviews)
                        </span>
                      )}
                    </div>

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.quantity && item.quantity > 0 ? `${item.quantity} available in campus` : 'Available'}
                    </span>
                  </div>
                </div>

                {/* Seller Card */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 font-extrabold text-sm text-sky-700 dark:bg-sky-950 dark:text-sky-300 shrink-0">
                      {item.owner?.full_name ? item.owner.full_name.charAt(0) : 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {item.owner?.full_name || 'PEC Student'}
                        </span>
                        <ShieldCheck size={14} className="text-sky-500 shrink-0" title="Verified PEC Domain" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.owner?.hostel_name ? `${item.owner.hostel_name} · Room ${item.owner.room_number}` : `Room ${item.owner?.room_number || 'Campus'}`}
                      </p>
                    </div>
                  </div>

                  {!isOwn && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenChat(
                          item.owner_id,
                          item.owner?.full_name || 'Owner',
                          item.equipment_id,
                          item.equipment_name
                        )
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-600 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-slate-800 transition shrink-0"
                    >
                      <MessageSquare size={14} /> Chat
                    </button>
                  )}
                </div>

                {/* Interactive Workflow: Buy vs Rent */}
                {isSell ? (
                  /* ── SALE WORKFLOW ── */
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400">
                        Purchase Price
                      </span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
                        <IndianRupee size={20} className="stroke-[2.5]" />
                        {item.sale_price != null ? item.sale_price : item.price_note || 'Negotiable'}
                      </span>
                    </div>

                    {maxQty > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={quantity <= 1}
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={quantity >= maxQty}
                            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── RENTAL WORKFLOW ── */
                  <RentalDateSelector
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    ratePerDay={item.rate_per_day}
                    ratePerMonth={item.rate_per_month}
                    ratePerSemester={item.rate_per_semester}
                    priceNote={item.price_note}
                  />
                )}

                {/* Optional Note */}
                {!isOwn && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Note for Owner (Optional)
                    </label>
                    <input
                      type="text"
                      value={buyerNote}
                      onChange={(e) => setBuyerNote(e.target.value)}
                      placeholder="e.g., Can pick up today at 6 PM after lab"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Transparent Offline Payment Notice */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-semibold">Pay on Handover (Cash / UPI)</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Zero Platform Fee</span>
                </div>

                {/* Primary CTA Button */}
                <div>
                  {isOwn ? (
                    <div className="w-full rounded-2xl bg-slate-100 py-3 text-center text-sm font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      This is your listing
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting || (!isSell && (!startDate || !endDate))}
                      onClick={handleSubmitRequest}
                      className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl py-3 px-6 text-sm font-extrabold text-white shadow-xl transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
                        isSell
                          ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25'
                          : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/25'
                      }`}
                    >
                      {submitting ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Check size={18} />
                      )}
                      {isSell ? 'Send Purchase Request' : 'Request Rental Period'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Reviews Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <ReviewsList
                reviews={reviews}
                avgRating={item.avg_rating}
                reviewCount={item.review_count}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
