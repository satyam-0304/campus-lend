import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Star,
  Trash2,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight,
  LoaderCircle,
  Inbox,
  Send,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { BorrowRequestWithDetails, EquipmentWithOwner, RequestStatus } from '@/lib/types';

interface SellerHubProps {
  userId: string;
  showToast: (msg: string) => void;
  onOpenChat: (recipientId: string, recipientName: string, equipmentId?: string, equipmentName?: string, requestId?: string) => void;
  onOpenReview: (requestId: string, equipmentId: string, equipmentName: string) => void;
  onNavigateToAddItem: () => void;
}

export function SellerHub({
  userId,
  showToast,
  onOpenChat,
  onOpenReview,
  onNavigateToAddItem,
}: SellerHubProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'listings' | 'outgoing'>('requests');
  const [incoming, setIncoming] = useState<BorrowRequestWithDetails[]>([]);
  const [outgoing, setOutgoing] = useState<BorrowRequestWithDetails[]>([]);
  const [myListings, setMyListings] = useState<EquipmentWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dash, listings] = await Promise.all([
        api.getDashboard(),
        api.getMyEquipment(),
      ]);
      setIncoming(dash.lending || []);
      setOutgoing(dash.borrowed || []);
      setMyListings(listings || []);
    } catch {
      // not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (requestId: string, status: RequestStatus, itemInfo?: { equipment_id: string; equipment_name: string }) => {
    setActionLoadingId(requestId);
    try {
      await api.updateRequestStatus(requestId, status);
      setIncoming((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, status } : r))
      );

      let toastMsg = 'Status updated';
      if (status === 'approved') toastMsg = 'Request approved 🎉';
      if (status === 'rejected') toastMsg = 'Request declined';
      if (status === 'active') toastMsg = 'Handover confirmed — rental is now active 📦';
      if (status === 'returned') toastMsg = 'Return confirmed! Inventory stock restored ★';
      if (status === 'completed') toastMsg = 'Sale completed successfully! ★';
      showToast(toastMsg);

      // Reload listings to reflect restored inventory if returned
      if (status === 'returned' || status === 'approved') {
        api.getMyEquipment().then(setMyListings).catch(() => {});
      }

      // If returned or completed, prompt seller to rate borrower
      if ((status === 'returned' || status === 'completed') && itemInfo) {
        onOpenReview(requestId, itemInfo.equipment_id, itemInfo.equipment_name);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not update request. Please retry.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelOutgoing = async (requestId: string) => {
    try {
      await api.cancelRequest(requestId);
      setOutgoing((prev) => prev.filter((r) => r.request_id !== requestId));
      showToast('Request cancelled');
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel request');
    }
  };

  const handleDeleteListing = async (equipmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await api.deleteEquipment(equipmentId);
      setMyListings((prev) => prev.filter((i) => i.equipment_id !== equipmentId));
      showToast('Listing removed');
    } catch (err: any) {
      showToast(err?.message || 'Could not delete listing');
    }
  };

  const pendingCount = incoming.filter((r) => r.status === 'pending').length;
  const activeCount = incoming.filter((r) => r.status === 'active' || r.status === 'approved').length;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoaderCircle size={32} className="animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Top Header & Metrics ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Marketplace Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Seller & Activity Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your campus listings, incoming requests, and active handovers.
          </p>
        </div>

        <button
          onClick={onNavigateToAddItem}
          className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Add New Listing
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Published Items</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {myListings.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            Pending Requests
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active Handovers</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </p>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition ${
            activeTab === 'requests'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Inbox size={16} />
          Incoming Requests
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.5 font-black">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition ${
            activeTab === 'listings'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Package size={16} />
          My Published Listings ({myListings.length})
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition ${
            activeTab === 'outgoing'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Send size={16} />
          My Borrow / Buy Requests ({outgoing.length})
        </button>
      </div>

      {/* ── Sub-tab Content ── */}

      {/* TAB 1: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {incoming.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              <Inbox size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No incoming requests yet</p>
              <p className="text-xs mt-1">When students ask to borrow or buy your items, you'll see them here.</p>
            </div>
          ) : (
            incoming.map((req) => {
              const isSale = req.request_type === 'sell';
              const isLoading = actionLoadingId === req.request_id;

              return (
                <div
                  key={req.request_id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            isSale ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                          }`}
                        >
                          {isSale ? 'Purchase Request' : 'Rental Request'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : req.status === 'active'
                              ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400'
                              : req.status === 'returned' || req.status === 'completed'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : req.status === 'rejected'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {req.status === 'active' ? 'Active Handover' : req.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {req.equipment?.equipment_name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {req.borrower?.full_name}
                        </span>
                        <ShieldCheck size={13} className="text-sky-500" />
                        <span>·</span>
                        <span>{req.borrower?.hostel_name ? `${req.borrower.hostel_name} (Room ${req.borrower.room_number})` : `Room ${req.borrower?.room_number}`}</span>
                        {req.borrower?.branch && <span>· {req.borrower.branch}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {req.total_amount != null && (
                        <span className="flex items-center text-lg font-black text-slate-900 dark:text-white">
                          <IndianRupee size={16} /> {req.total_amount}
                        </span>
                      )}

                      <button
                        onClick={() =>
                          onOpenChat(
                            req.borrower_id,
                            req.borrower?.full_name || 'Requester',
                            req.equipment_id,
                            req.equipment?.equipment_name,
                            req.request_id
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition"
                      >
                        <MessageSquare size={13} /> Chat
                      </button>
                    </div>
                  </div>

                  {/* Dates / Duration info */}
                  {(req.rental_start_date || req.rental_end_date || req.buyer_note) && (
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                      {req.rental_start_date && req.rental_end_date && (
                        <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Calendar size={13} className="text-teal-600" />
                          <span>
                            Rental Dates: <strong>{req.rental_start_date}</strong> to{' '}
                            <strong>{req.rental_end_date}</strong>
                          </span>
                        </p>
                      )}
                      {req.buyer_note && (
                        <p className="text-slate-500 dark:text-slate-400 italic">
                          "{req.buyer_note}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Status Lifecycle Actions ── */}
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {req.status === 'pending' && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(req.request_id, 'approved', { equipment_id: req.equipment_id, equipment_name: req.equipment?.equipment_name })}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition"
                        >
                          <CheckCircle2 size={14} /> Approve Request
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(req.request_id, 'rejected')}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400 transition"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    )}

                    {req.status === 'approved' && !isSale && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateStatus(req.request_id, 'active')}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 active:scale-95 transition"
                      >
                        <Package size={14} /> Confirm Item Handed Over
                      </button>
                    )}

                    {req.status === 'approved' && isSale && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateStatus(req.request_id, 'completed', { equipment_id: req.equipment_id, equipment_name: req.equipment?.equipment_name })}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                      >
                        <CheckCircle2 size={14} /> Confirm Sold & Handed Over
                      </button>
                    )}

                    {req.status === 'active' && !isSale && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateStatus(req.request_id, 'returned', { equipment_id: req.equipment_id, equipment_name: req.equipment?.equipment_name })}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                      >
                        <CheckCircle2 size={14} /> Confirm Return & Restock Item
                      </button>
                    )}

                    {(req.status === 'returned' || req.status === 'completed') && (
                      <button
                        onClick={() => onOpenReview(req.request_id, req.equipment_id, req.equipment?.equipment_name)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"
                      >
                        <Star size={13} className="fill-amber-400 text-amber-400" /> Rate Student
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: MY PUBLISHED LISTINGS */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myListings.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              <Package size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">You haven't listed any items yet</p>
              <button
                onClick={onNavigateToAddItem}
                className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-sky-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-sky-700"
              >
                <Plus size={14} /> Add your first item
              </button>
            </div>
          ) : (
            myListings.map((item) => {
              const isSell = item.listing_type === 'sell';
              const reqsForItem = incoming.filter((r) => r.equipment_id === item.equipment_id && r.status === 'pending');

              return (
                <div
                  key={item.equipment_id}
                  className="group flex flex-col rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center p-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.equipment_name}
                        className="max-h-full w-full object-contain"
                      />
                    ) : (
                      <Package size={32} className="text-slate-300 dark:text-slate-600" />
                    )}

                    <div className="absolute top-3 left-3">
                      {isSell ? (
                        <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          For Sale
                        </span>
                      ) : (
                        <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          For Rent
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {item.quantity} in stock
                      </span>
                    </div>

                    {reqsForItem.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md animate-bounce">
                        {reqsForItem.length} pending request{reqsForItem.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-1 flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                        {item.equipment_name}
                      </h4>

                      <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isSell ? (
                          <span>₹{item.sale_price ?? item.price_note ?? '—'}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {item.rate_per_day && <span className="text-teal-600">₹{item.rate_per_day}/day</span>}
                            {item.rate_per_month && <span className="text-sky-600">₹{item.rate_per_month}/mo</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${item.status === 'available' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ● {item.status}
                      </span>
                      <button
                        onClick={() => handleDeleteListing(item.equipment_id)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Remove listing"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: MY OUTGOING REQUESTS */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoing.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              <Send size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">You haven't requested any items yet</p>
              <p className="text-xs mt-1">Browse the Explore tab to find calculators, lab coats, and accessories!</p>
            </div>
          ) : (
            outgoing.map((req) => (
              <div
                key={req.request_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200/90 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400">
                      {req.request_type === 'sell' ? 'Purchase' : 'Rental'}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase rounded-full px-2 py-0.5 ${
                        req.status === 'approved' || req.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : req.status === 'rejected'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {req.equipment?.equipment_name}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Owner: {req.owner?.full_name} · {req.owner?.hostel_name || `Room ${req.owner?.room_number}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() =>
                      onOpenChat(
                        req.owner_id,
                        req.owner?.full_name || 'Owner',
                        req.equipment_id,
                        req.equipment?.equipment_name,
                        req.request_id
                      )
                    }
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <MessageSquare size={13} /> Chat
                  </button>

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOutgoing(req.request_id)}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  )}

                  {(req.status === 'active' || req.status === 'returned' || req.status === 'completed') && (
                    <button
                      onClick={() => onOpenReview(req.request_id, req.equipment_id, req.equipment?.equipment_name)}
                      className="flex items-center gap-1 rounded-xl bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600"
                    >
                      <Star size={13} /> Review Item
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
