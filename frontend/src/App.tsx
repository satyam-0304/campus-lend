import {
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  Compass,
  FileText,
  Image,
  IndianRupee,
  Laptop,
  LoaderCircle,
  LogOut,
  Menu,
  PackagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type {
  BorrowRequestWithDetails,
  Category,
  EquipmentWithOwner,
  Profile,
  RequestStatus,
} from '@/lib/types';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';

type Page = 'explore' | 'add' | 'dashboard' | 'profile';

// Pending action captured before profile modal
type PendingAction =
  | { type: 'request'; item: EquipmentWithOwner }
  | { type: 'list'; formData: { name: string; category: Category; imageUrl: string; priceNote: string } };

const categoryLabels: Record<Category, string> = {
  academics: 'Academics',
  electronics: 'Electronics',
  sports: 'Sports',
  event_wear: 'Event wear',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const BUCKET = 'item-images';

// ── Supabase Storage upload helper ─────────────────────────────
async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{ user: { id: string; email?: string; user_metadata?: { full_name?: string } } } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [page, setPage] = useState<Page>('explore');
  const [toast, setToast] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Profile completion modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fallbackTimer = window.setTimeout(() => {
      if (isMounted) setReady(true);
    }, 1200);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && isMounted) {
          setSession(data.session);
        }
      } catch {
        /* getSession failed — session stays null, user sees landing page */
      } finally {
        if (isMounted) setReady(true);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) setSession(newSession);
      else setSession(null);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    (async () => {
      try {
        const data = await api.getMyProfile();
        setProfile(data);
      } catch {
        /* Profile fetch failed — stays null, show spinner until resolved */
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [session]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setSession(null);
    setProfile(null);
  };

  // Called by Explore/AddItem to check if profile is complete before acting
  const requireProfile = (action: PendingAction): boolean => {
    if (!profile?.room_number || !profile?.phone_number) {
      setPendingAction(action);
      setProfileModalOpen(true);
      return false; // not complete — caller should abort
    }
    return true; // complete — caller can proceed
  };

  // Called when ProfileCompletionModal saves successfully
  const handleProfileSaved = (savedProfile: Profile) => {
    setProfile(savedProfile);
    setProfileModalOpen(false);
    // If there was a pending action, the component that triggered it
    // will re-attempt via pendingAction state (passed down as prop)
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle size={28} className="animate-spin text-sky-500" />
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <>
        <LandingPage
          onLogin={() => openAuth('login')}
          onSignUp={() => openAuth('signup')}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          onSuccess={showToast}
        />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
            <Check size={17} className="text-emerald-400" />
            {toast}
          </div>
        )}
      </>
    );
  }

  // Show spinner while profile is being fetched (first load after login)
  if (profileLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle size={28} className="animate-spin text-sky-500" />
      </div>
    );
  }

  // profile can be null briefly — guard downstream components with profile!
  const safeProfile: Profile = profile ?? { id: session.user.id, full_name: session.user.user_metadata?.full_name ?? '', room_number: '', phone_number: '' };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
        initials={getInitials(safeProfile.full_name)}
      />
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        {page === 'explore' && (
          <Explore
            userId={session.user.id}
            showToast={showToast}
            profile={safeProfile}
            requireProfile={requireProfile}
            pendingAction={pendingAction}
            clearPendingAction={() => setPendingAction(null)}
          />
        )}
        {page === 'add' && (
          <AddItem
            ownerId={session.user.id}
            ownerProfile={safeProfile}
            onDone={() => setPage('explore')}
            showToast={showToast}
            requireProfile={requireProfile}
            pendingAction={pendingAction}
            clearPendingAction={() => setPendingAction(null)}
          />
        )}
        {page === 'dashboard' && <Dashboard userId={session.user.id} showToast={showToast} />}
        {page === 'profile' && <ProfilePage profile={safeProfile} setProfile={setProfile} showToast={showToast} />}
      </main>

      {/* Profile completion modal — shown when room/phone not filled yet */}
      {profileModalOpen && (
        <ProfileCompletionModal
          initialName={safeProfile.full_name}
          onSave={handleProfileSaved}
          onCancel={() => { setProfileModalOpen(false); setPendingAction(null); }}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          <Check size={17} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Profile Completion Modal ────────────────────────────────────

function ProfileCompletionModal({
  initialName,
  onSave,
  onCancel,
  showToast,
}: {
  initialName: string;
  onSave: (p: Profile) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [room, setRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!room.trim()) { setError('Room number is required'); return; }
    setLoading(true);
    try {
      const data = await api.updateMyProfile({ full_name: fullName, room_number: room, phone_number: phone });
      showToast('Profile saved!');
      onSave(data);
    } catch (err: any) {
      setError(err?.message || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100 sm:p-8 animate-[fadeSlideUp_0.2s_ease-out]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-extrabold">One quick step</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              We need your room number so other students can find you for handoffs.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Field label="Room number" placeholder="204-B" value={room} onChange={(e) => setRoom(e.target.value)} required />
          <Field label="Phone number (optional)" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-70">
            {loading && <LoaderCircle size={17} className="animate-spin" />}
            Save & continue <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Auth ───────────────────────────────────────────────────

function AuthScreen({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          onSuccess('Account created — welcome to CampusLend');
        } else {
          setError('Signup failed. Please try again.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        onSuccess('Logged in');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error — please check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">CampusLend</h1>
          <p className="mt-2 text-sm text-slate-500">Share more. Carry less.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 sm:p-8">
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-50 p-1">
            <button type="button" onClick={() => setMode('login')} className={`rounded-lg py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Log in</button>
            <button type="button" onClick={() => setMode('signup')} className={`rounded-lg py-2.5 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Sign up</button>
          </div>
          <h2 className="text-xl font-extrabold">{mode === 'login' ? 'Welcome back' : 'Join your campus'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Find the things you need, right where you live.' : 'Create an account to lend and borrow with ease.'}</p>
          {error && <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && <Field label="Full name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />}
            <Field label="Email" type="email" placeholder="john@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {mode === 'login' ? 'Log in' : 'Create account'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">By continuing, you agree to keep your campus community safe and respectful.</p>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────

function Navbar({ page, setPage, onLogout, initials }: { page: Page; setPage: (p: Page) => void; onLogout: () => void; initials: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const links: { id: Page; label: string; icon: typeof Compass }[] = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'add', label: 'Add item', icon: PackagePlus },
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-6 sm:px-10 lg:px-12">
        <button onClick={() => setPage('explore')} className="flex items-center gap-3.5 shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-slate-200/80"><img src="/assets/images/logo.jpeg" alt="" className="h-full w-full object-cover" /></div>
          <span className="text-xl font-extrabold tracking-tight">Campus<span className="text-sky-600">Lend</span></span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${page === id ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="relative flex items-center gap-3">
          <button className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:block"><Bell size={19} /></button>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-full bg-slate-50 p-1.5 pr-2.5 transition hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700">{initials}</div>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-40 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              <button onClick={() => { setPage('profile'); setUserMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><UserRound size={16} />Profile</button>
              <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={16} />Log out</button>
            </div>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-slate-500 md:hidden">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-slate-100 px-5 py-3 md:hidden">
          {links.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${page === id ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

// ── Explore ────────────────────────────────────────────────

function Explore({
  userId,
  showToast,
  profile,
  requireProfile,
  pendingAction,
  clearPendingAction,
}: {
  userId: string;
  showToast: (msg: string) => void;
  profile: Profile;
  requireProfile: (action: PendingAction) => boolean;
  pendingAction: PendingAction | null;
  clearPendingAction: () => void;
}) {
  const [items, setItems] = useState<EquipmentWithOwner[]>([]);
  const [myRequests, setMyRequests] = useState<Record<string, { status: RequestStatus; requestId: string }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getEquipment();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyRequests = useCallback(async () => {
    try {
      const { borrowed } = await api.getDashboard();
      const map: Record<string, { status: RequestStatus; requestId: string }> = {};
      borrowed.forEach((r) => { map[r.equipment_id] = { status: r.status, requestId: r.request_id }; });
      setMyRequests(map);
    } catch {
      /* Not critical — request status map stays empty */
    }
  }, [userId]);

  useEffect(() => { loadItems(); loadMyRequests(); }, [loadItems, loadMyRequests]);

  // Re-attempt pending request after profile was saved
  useEffect(() => {
    if (pendingAction?.type === 'request' && profile.room_number) {
      const item = pendingAction.item;
      clearPendingAction();
      handleRequest(item);
    }
  }, [profile.room_number, pendingAction]);

  const filtered = useMemo(
    () => items.filter((item) => item.equipment_name.toLowerCase().includes(search.toLowerCase()) && (category === 'all' || item.category === category)),
    [items, search, category],
  );

  const handleRequest = async (item: EquipmentWithOwner) => {
    if (!requireProfile({ type: 'request', item })) return;
    try {
      const req = await api.createRequest({ equipment_id: item.equipment_id, owner_id: item.owner_id });
      setMyRequests((prev) => ({ ...prev, [item.equipment_id]: { status: 'pending', requestId: req.request_id } }));
      showToast('Request sent to the owner');
    } catch (err: any) {
      showToast(err?.message || 'Could not send request. Please try again.');
    }
  };

  const handleCancelRequest = async (item: EquipmentWithOwner) => {
    const entry = myRequests[item.equipment_id];
    if (!entry) return;
    try {
      await api.cancelRequest(entry.requestId);
      setMyRequests((prev) => {
        const next = { ...prev };
        delete next[item.equipment_id];
        return next;
      });
      showToast('Request cancelled');
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel request. Please try again.');
    }
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div>
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-700"><Sparkles size={14} /> Campus exchange</div>
          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Borrow what you need.<br /><span className="text-sky-600">Lend what you can.</span></h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">A simpler way to share useful things with the people around you.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex -space-x-2"><div className="h-8 w-8 rounded-full border-2 border-white bg-amber-100" /><div className="h-8 w-8 rounded-full border-2 border-white bg-sky-100" /><div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-100" /></div>
          <div><p className="text-sm font-extrabold">{items.length} items</p><p className="text-xs text-slate-400">listed on campus</p></div>
        </div>
      </div>
      <div className="mb-7 flex flex-col gap-4">
        <div className="relative max-w-xl">
          <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" placeholder="Search for calculators, rackets, adapters..." />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'academics', 'electronics', 'sports', 'event_wear'] as const).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category === cat ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'border border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-700'}`}>
              {cat === 'all' ? 'All items' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Available near you</h2>
        <span className="text-sm font-semibold text-slate-400">{filtered.length} items</span>
      </div>
      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard
              key={item.equipment_id}
              item={item}
              isOwn={item.owner_id === userId}
              requestEntry={myRequests[item.equipment_id]}
              onRequest={handleRequest}
              onCancelRequest={handleCancelRequest}
            />
          ))}
        </div>
      ) : (
        <Empty icon={<Search size={26} />} title="No items found" text="Try a different search or category." />
      )}
    </div>
  );
}

function ItemCard({
  item,
  isOwn,
  requestEntry,
  onRequest,
  onCancelRequest,
}: {
  item: EquipmentWithOwner;
  isOwn: boolean;
  requestEntry?: { status: RequestStatus; requestId: string };
  onRequest: (item: EquipmentWithOwner) => void;
  onCancelRequest: (item: EquipmentWithOwner) => void;
}) {
  const requestStatus = requestEntry?.status;
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/60 overflow-hidden">
      {/* Item image or category icon */}
      {item.image_url ? (
        <div className="h-44 w-full overflow-hidden bg-slate-100">
          <img src={item.image_url} alt={item.equipment_name} className="h-full w-full object-cover transition group-hover:scale-105" />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-sky-50">
          {item.category === 'electronics' ? <Laptop size={40} className="text-sky-300" /> : item.category === 'academics' ? <BookOpen size={40} className="text-sky-300" /> : item.category === 'sports' ? <Compass size={40} className="text-sky-300" /> : <Sparkles size={40} className="text-sky-300" />}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">{categoryLabels[item.category]}</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${item.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{item.equipment_name}</h3>
        {item.price_note && (
          <div className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-amber-600">
            <IndianRupee size={13} />
            <span>{item.price_note}</span>
          </div>
        )}
        <p className="mt-2 flex-1 text-sm text-slate-500">Owned by <span className="font-bold text-slate-700">{item.owner.full_name}</span> · Room {item.owner.room_number}</p>

        <div className="mt-5">
          {isOwn ? (
            <div className="w-full rounded-xl bg-slate-50 py-3 text-center text-sm font-bold text-slate-400">Your listing</div>
          ) : requestStatus === 'pending' ? (
            <div className="flex gap-2">
              <div className="flex flex-1 items-center justify-center rounded-xl bg-amber-50 py-3 text-sm font-bold text-amber-600">Request sent</div>
              <button
                onClick={() => onCancelRequest(item)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-3 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
                title="Cancel request"
              >
                <XCircle size={15} /> Cancel
              </button>
            </div>
          ) : (
            <button
              disabled={item.status !== 'available' || requestStatus === 'approved'}
              onClick={() => onRequest(item)}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-extrabold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {item.status !== 'available' ? 'Currently borrowed' : requestStatus === 'approved' ? 'Approved ✓' : 'Request to borrow'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Image Upload Component ──────────────────────────────────

function ImageUploader({
  onUploaded,
  userId,
}: {
  onUploaded: (url: string) => void;
  userId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB');
      return;
    }
    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file, userId);
      onUploaded(url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        Item photo <span className="text-rose-500">*</span>
      </label>
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200">
          <img src={preview} alt="Preview" className="h-52 w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <LoaderCircle size={28} className="animate-spin text-sky-500" />
              <span className="ml-2 text-sm font-semibold text-sky-600">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => { setPreview(null); onUploaded(''); if (inputRef.current) inputRef.current.value = ''; }}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-600 shadow hover:bg-white"
            >
              <X size={13} /> Change
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition ${dragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/50'}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-sky-500">
            <Upload size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Drop your photo here, or <span className="text-sky-600">browse</span></p>
            <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WebP · max 5 MB</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
      {error && <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

// ── Add Item ───────────────────────────────────────────────

function AddItem({
  ownerId,
  ownerProfile,
  onDone,
  showToast,
  requireProfile,
  pendingAction,
  clearPendingAction,
}: {
  ownerId: string;
  ownerProfile: Profile;
  onDone: () => void;
  showToast: (msg: string) => void;
  requireProfile: (action: PendingAction) => boolean;
  pendingAction: PendingAction | null;
  clearPendingAction: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('academics');
  const [imageUrl, setImageUrl] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // My listings state
  const [myItems, setMyItems] = useState<EquipmentWithOwner[]>([]);
  const [myItemsLoading, setMyItemsLoading] = useState(true);

  const loadMyItems = useCallback(async () => {
    try {
      const data = await api.getMyEquipment();
      setMyItems(data);
    } catch {
      setMyItems([]);
    } finally {
      setMyItemsLoading(false);
    }
  }, []);

  useEffect(() => { loadMyItems(); }, [loadMyItems]);

  // Re-attempt listing after profile was saved via modal
  useEffect(() => {
    if (pendingAction?.type === 'list' && ownerProfile.room_number) {
      const { name: pName, category: pCat, imageUrl: pUrl, priceNote: pPrice } = pendingAction.formData;
      clearPendingAction();
      doSubmit(pName, pCat, pUrl, pPrice);
    }
  }, [ownerProfile.room_number, pendingAction]);

  const doSubmit = async (itemName: string, itemCat: Category, itemImageUrl: string, itemPriceNote: string) => {
    setError('');
    setLoading(true);
    try {
      const newItem = await api.createEquipment({
        equipment_name: itemName,
        category: itemCat,
        image_url: itemImageUrl,
        price_note: itemPriceNote || null,
      });
      setMyItems((prev) => [newItem, ...prev]);
      showToast('Item added to the campus library 🎉');
      // Reset form
      setName('');
      setCategory('academics');
      setImageUrl('');
      setPriceNote('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add item. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!imageUrl) { setError('Please upload a photo of your item before listing.'); return; }
    if (!requireProfile({ type: 'list', formData: { name, category, imageUrl, priceNote } })) return;
    await doSubmit(name, category, imageUrl, priceNote);
  };

  const handleDelete = async (equipmentId: string) => {
    try {
      await api.deleteEquipment(equipmentId);
      setMyItems((prev) => prev.filter((i) => i.equipment_id !== equipmentId));
      showToast('Listing removed');
    } catch (err: any) {
      showToast(err?.message || 'Could not delete item. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onDone} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-600"><ChevronLeft size={17} />Back to explore</button>
      <div className="mb-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><PackagePlus size={24} /></div>
        <h1 className="text-3xl font-extrabold tracking-tight">Share an item</h1>
        <p className="mt-2 text-slate-500">Give something useful a second life on campus.</p>
      </div>
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-6">
          <Field label="What are you sharing?" placeholder="e.g. Scientific calculator" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10">
              <option value="academics">Academics</option>
              <option value="electronics">Electronics</option>
              <option value="sports">Sports</option>
              <option value="event_wear">Event wear</option>
            </select>
          </div>
          {/* Image upload — required */}
          <ImageUploader onUploaded={setImageUrl} userId={ownerId} />
          {/* Price note — optional */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Price / Terms <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. ₹50/day, free for 2 days, negotiable"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>}
        <button disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-70">
          {loading && <LoaderCircle size={17} className="animate-spin" />}
          List this item <ArrowRight size={17} />
        </button>
      </form>

      {/* ── My Listings ────────────────────────────── */}
      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Your listings</h2>
            <p className="mt-0.5 text-sm text-slate-400">Items you've shared on campus</p>
          </div>
          {myItems.length > 0 && <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">{myItems.length} item{myItems.length !== 1 ? 's' : ''}</span>}
        </div>

        {myItemsLoading ? (
          <CenteredSpinner />
        ) : myItems.length === 0 ? (
          <Empty icon={<PackagePlus size={24} />} title="No listings yet" text="Items you add above will appear here." />
        ) : (
          <div className="space-y-3">
            {myItems.map((item) => (
              <div key={item.equipment_id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                {item.image_url ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={item.image_url} alt={item.equipment_name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-400">
                    <Image size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-extrabold text-slate-900">{item.equipment_name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{categoryLabels[item.category]}</p>
                  {item.price_note && (
                    <p className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                      <IndianRupee size={11} />{item.price_note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${item.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span>
                  <button
                    onClick={() => handleDelete(item.equipment_id)}
                    className="flex items-center gap-1 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                    title="Remove listing"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────

function Dashboard({ userId, showToast }: { userId: string; showToast: (msg: string) => void }) {
  const [outgoing, setOutgoing] = useState<BorrowRequestWithDetails[]>([]);
  const [incoming, setIncoming] = useState<BorrowRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { borrowed, lending } = await api.getDashboard();
      setOutgoing(borrowed || []);
      setIncoming(lending || []);
    } catch {
      setOutgoing([]);
      setIncoming([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (requestId: string, status: RequestStatus) => {
    try {
      await api.updateRequestStatus(requestId, status);
      setIncoming((prev) => prev.map((r) => r.request_id === requestId ? { ...r, status } : r));
      showToast(status === 'approved' ? 'Request approved' : 'Request declined');
    } catch (err: any) {
      showToast(err?.message || 'Could not update request. Please try again.');
    }
  };

  const handleCancelOutgoing = async (requestId: string) => {
    try {
      await api.cancelRequest(requestId);
      setOutgoing((prev) => prev.filter((r) => r.request_id !== requestId));
      showToast('Request cancelled');
    } catch (err: any) {
      showToast(err?.message || 'Could not cancel request. Please try again.');
    }
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold text-sky-600">Your activity</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-slate-500">Keep track of your lending and borrowing.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Outgoing requests */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold">My requests</h2>
            <p className="mt-1 text-sm text-slate-500">Items you asked to borrow</p>
          </div>
          {outgoing.length ? (
            <div className="space-y-3">
              {outgoing.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold">{request.equipment.equipment_name}</h3>
                    <p className="mt-1 text-xs text-slate-500">Owner: {request.owner.full_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={request.status} />
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOutgoing(request.request_id)}
                        className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={<FileText size={24} />} title="Nothing here yet" text="You haven't requested anything yet." />
          )}
        </div>

        {/* Incoming requests */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold">Requests for my items</h2>
            <p className="mt-1 text-sm text-slate-500">People waiting for your approval</p>
          </div>
          {incoming.length ? (
            <div className="space-y-3">
              {incoming.map((request) => (
                <div key={request.request_id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold">{request.equipment.equipment_name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{request.borrower.full_name} · Room {request.borrower.room_number}</p>
                      {request.borrower.phone_number && (
                        <p className="text-xs text-slate-400">📞 {request.borrower.phone_number}</p>
                      )}
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  {request.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleUpdate(request.request_id, 'approved')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-extrabold text-white hover:bg-emerald-600"><Check size={14} />Approve</button>
                      <button onClick={() => handleUpdate(request.request_id, 'rejected')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-extrabold text-slate-500 hover:border-rose-200 hover:text-rose-600"><XCircle size={14} />Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={<Bell size={24} />} title="No requests yet" text="You'll see borrow requests here." />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────

function ProfilePage({ profile, setProfile, showToast }: { profile: Profile; setProfile: (p: Profile) => void; showToast: (msg: string) => void }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [room, setRoom] = useState(profile.room_number);
  const [phone, setPhone] = useState(profile.phone_number);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const data = await api.updateMyProfile({ full_name: fullName, room_number: room, phone_number: phone });
      setProfile(data);
      showToast('Profile changes saved');
    } catch (err: any) {
      showToast(err?.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold text-sky-600">Your account</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
        <p className="mt-2 text-slate-500">Keep your details up to date for easy handoffs.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-xl font-extrabold text-sky-700">{getInitials(fullName)}</div>
          <div><h2 className="text-xl font-extrabold">{fullName || 'Your name'}</h2><p className="mt-1 text-sm text-slate-400">CampusLend member</p></div>
        </div>
        <div className="space-y-5">
          <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field label="Room number" value={room} onChange={(e) => setRoom(e.target.value)} />
          <Field label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button onClick={save} disabled={saving} className="mt-8 flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-70">
          {saving && <LoaderCircle size={17} className="animate-spin" />}
          Save changes <Check size={17} />
        </button>
      </div>
      <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
        <ShieldCheck size={20} className="shrink-0" />
        <p><span className="font-extrabold">Your details are private.</span> Only your name and room number are shown when you list an item.</p>
      </div>
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${status === 'approved' ? 'bg-emerald-50 text-emerald-600' : status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{status}</span>;
}

function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">{icon}</div>
      <h3 className="text-sm font-extrabold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Field({ label, type = 'text', placeholder, value, onChange, required }: { label: string; type?: string; placeholder?: string; value?: string; onChange?: (event: ChangeEvent<HTMLInputElement>) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
    </div>
  );
}

function CenteredSpinner() {
  return <div className="flex items-center justify-center py-20"><LoaderCircle size={28} className="animate-spin text-sky-500" /></div>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  return (parts[0][0] ?? '?') + (parts[1]?.[0] ?? '');
}

export default App;
