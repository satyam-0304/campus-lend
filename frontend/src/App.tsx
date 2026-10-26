import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Compass,
  Eye,
  FileText,
  GraduationCap,
  Image,
  IndianRupee,
  Info,
  Laptop,
  Layers,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  Minus,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
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
  ListingType,
  Profile,
  RequestStatus,
} from '@/lib/types';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { PEC_HOSTELS, parsePecEmail, isValidPecEmail } from '@/lib/pecEmail';

type Page = 'explore' | 'add' | 'dashboard' | 'profile';

// Pending action captured before profile modal
type PendingAction =
  | { type: 'request'; item: EquipmentWithOwner }
  | {
      type: 'list';
      formData: {
        name: string;
        category: Category;
        imageUrl: string;
        priceNote: string;
        quantity: number;
        listingType: ListingType;
        salePrice: string;
        rateDay: string;
        rateMonth: string;
        rateSemester: string;
      };
    };

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
    const hasPhone = Boolean(profile?.phone_number?.trim());
    const hasSid = Boolean(profile?.student_id && /^\d{8}$/.test(profile.student_id.trim()));
    const hasResidence =
      profile?.residence_type === 'day_scholar'
        ? Boolean(profile?.address?.trim())
        : Boolean(profile?.room_number?.trim() && profile?.hostel_name?.trim());

    if (!hasPhone || !hasSid || !hasResidence) {
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

  // While auth state is resolving, show the landing page so the LCP element
  // (hero h1) paints immediately instead of a blank spinner.
  if (!ready) {
    return (
      <>
        <LandingPage onLogin={() => openAuth('login')} onSignUp={() => openAuth('signup')} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          onSuccess={showToast}
        />
      </>
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
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 sm:gap-3 rounded-2xl bg-slate-900 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl max-w-[calc(100vw-2rem)] text-center">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span className="truncate">{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Profile fetches in background — safeProfile fallback below handles the
  // null case so we never block rendering on this network call.
  const userPecMeta = session?.user?.email ? parsePecEmail(session.user.email) : null;

  // profile can be null briefly — guard downstream components with profile!
  const safeProfile: Profile = profile ?? {
    id: session.user.id,
    full_name: session.user.user_metadata?.full_name || userPecMeta?.formattedName || '',
    room_number: '',
    phone_number: '',
    student_id: session.user.user_metadata?.student_id || '',
    degree: session.user.user_metadata?.degree || userPecMeta?.degree || '',
    batch_year: session.user.user_metadata?.batch_year || userPecMeta?.batchYear || '',
    branch: session.user.user_metadata?.branch || userPecMeta?.branchName || userPecMeta?.branchCode || '',
    residence_type: '',
    hostel_name: '',
    address: '',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
        initials={getInitials(safeProfile.full_name)}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10 pb-16 pt-6 sm:pt-8">
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
        {page === 'profile' && (
          <ProfilePage
            profile={safeProfile}
            setProfile={setProfile}
            showToast={showToast}
            userEmail={session.user.email}
          />
        )}
      </main>

      {/* Profile completion modal — shown when room/phone not filled yet */}
      {profileModalOpen && (
        <ProfileCompletionModal
          profile={safeProfile}
          userEmail={session.user.email}
          onSave={handleProfileSaved}
          onCancel={() => { setProfileModalOpen(false); setPendingAction(null); }}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 sm:gap-3 rounded-2xl bg-slate-900 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl max-w-[calc(100vw-2rem)] text-center">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Profile Completion Modal ────────────────────────────────────

function ProfileCompletionModal({
  profile,
  userEmail,
  onSave,
  onCancel,
  showToast,
}: {
  profile: Profile;
  userEmail?: string;
  onSave: (p: Profile) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}) {
  const parsed = useMemo(() => parsePecEmail(userEmail || ''), [userEmail]);
  const degree = profile.degree || parsed.degree || 'B.Tech';
  const branch = profile.branch || parsed.branchName || parsed.branchCode || 'PEC';
  const batchYear = profile.batch_year || parsed.batchYear || '2025';

  const [fullName, setFullName] = useState(profile.full_name || parsed.formattedName);
  const [studentId, setStudentId] = useState(profile.student_id || '');
  const [phone, setPhone] = useState(profile.phone_number || '');
  const [residenceType, setResidenceType] = useState<'hosteller' | 'day_scholar'>(
    profile.residence_type === 'day_scholar' ? 'day_scholar' : 'hosteller'
  );
  const [hostel, setHostel] = useState(profile.hostel_name || '');
  const [room, setRoom] = useState(profile.room_number || '');
  const [address, setAddress] = useState(profile.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please provide your full name');
      return;
    }

    const cleanSid = studentId.trim();
    if (!/^\d{8}$/.test(cleanSid)) {
      setError('Student ID (SID) must be exactly 8 digits');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number for handoffs');
      return;
    }

    if (residenceType === 'hosteller') {
      if (!hostel) {
        setError('Please select your PEC Hostel');
        return;
      }
      if (!room.trim()) {
        setError('Please enter your hostel room number');
        return;
      }
    } else {
      if (!address.trim()) {
        setError('Please enter your local address / sector');
        return;
      }
    }

    setLoading(true);
    try {
      const data = await api.updateMyProfile({
        full_name: fullName.trim(),
        student_id: cleanSid,
        phone_number: cleanPhone,
        degree,
        batch_year: batchYear,
        branch,
        residence_type: residenceType,
        hostel_name: residenceType === 'hosteller' ? hostel : '',
        room_number: residenceType === 'hosteller' ? room.trim() : '',
        address: residenceType === 'day_scholar' ? address.trim() : '',
      });
      showToast('Profile completed!');
      onSave(data);
    } catch (err: any) {
      setError(err?.message || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm">
      <div className="my-auto w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl ring-1 ring-slate-100 animate-[fadeSlideUp_0.2s_ease-out]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <GraduationCap size={22} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Complete your student profile</h2>
            <p className="mt-1 text-xs sm:text-sm leading-6 text-slate-500">
              CampusLend uses this info so peers can verify items and coordinate handoffs.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Auto-detected PEC badge banner */}
        <div className="mb-5 rounded-2xl bg-sky-50/70 border border-sky-100 p-3.5 flex items-center gap-3 text-xs sm:text-sm">
          <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 font-extrabold">
            PEC
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">
              {degree} {branch}
            </p>
            <p className="text-xs text-sky-700 truncate">
              Joining Batch {batchYear} • {userEmail || 'Verified PEC Student'}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-600">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

          <div>
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <label className="text-xs sm:text-sm font-bold text-slate-700">Student ID (SID)</label>
              <span className={`text-xs ${studentId.length === 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {studentId.length}/8 digits
              </span>
            </div>
            <input
              type="text"
              placeholder="Enter 8-digit SID"
              value={studentId}
              maxLength={8}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700">Mobile number</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          {/* Residence Type Selector */}
          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700">Campus Residence</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setResidenceType('hosteller')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition ${
                  residenceType === 'hosteller' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                Hosteller
              </button>
              <button
                type="button"
                onClick={() => setResidenceType('day_scholar')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition ${
                  residenceType === 'day_scholar' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapPin size={15} />
                Day Scholar
              </button>
            </div>
          </div>

          {residenceType === 'hosteller' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">PEC Hostel</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base sm:text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                >
                  <option value="">Select hostel...</option>
                  {PEC_HOSTELS.map((h) => (
                    <option key={h} value={h}>
                      {h} Hostel
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Room number</label>
                <input
                  type="text"
                  placeholder="e.g. 204-B"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-150">
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Locality / Address</label>
              <input
                type="text"
                placeholder="e.g. Sector 15-D, Chandigarh"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>
          )}

          <button
            disabled={loading}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-70"
          >
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

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidPecEmail(cleanEmail)) {
      setError('Access restricted: Please enter your valid @pec.edu.in institute email.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const parsed = parsePecEmail(cleanEmail);
        const fullName = name.trim() || parsed.formattedName;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              degree: parsed.degree,
              batch_year: parsed.batchYear,
              branch: parsed.branchName || parsed.branchCode,
            },
          },
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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
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
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">CampusLend</h1>
          <p className="mt-2 text-sm text-slate-500">Share more. Carry less.</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 sm:p-8">
          <div className="mb-6 sm:mb-7 grid grid-cols-2 rounded-xl bg-slate-50 p-1">
            <button type="button" onClick={() => setMode('login')} className={`flex min-h-[44px] items-center justify-center rounded-lg py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Log in</button>
            <button type="button" onClick={() => setMode('signup')} className={`flex min-h-[44px] items-center justify-center rounded-lg py-2.5 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sign up</button>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Join your campus'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Find the things you need, right where you live.' : 'Create an account to lend and borrow with ease.'}</p>
          {error && <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && <Field label="Full name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />}
            <Field label="Email" type="email" placeholder="john@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button disabled={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70">
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
      <div className="mx-auto flex h-16 sm:h-20 max-w-[1360px] items-center justify-between px-4 sm:px-8 lg:px-12">
        <button onClick={() => setPage('explore')} className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-slate-200/80"><img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" /></div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight">Campus<span className="text-sky-600">Lend</span></span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${page === id ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="relative flex items-center gap-2 sm:gap-3">
          <button className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:block"><Bell size={19} /></button>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-50 p-1 sm:p-1.5 sm:pr-2.5 transition hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700">{initials}</div>
            <ChevronDown size={15} className="text-slate-400 hidden sm:block" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              <button onClick={() => { setPage('profile'); setUserMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><UserRound size={16} />Profile</button>
              <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={16} />Log out</button>
            </div>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-slate-100 px-4 py-3 md:hidden space-y-1 bg-white">
          {links.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id); setMobileOpen(false); }} className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold ${page === id ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={17} />{label}
            </button>
          ))}
          <div className="my-1 border-t border-slate-100 pt-1">
            <button onClick={() => { setPage('profile'); setMobileOpen(false); }} className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold ${page === 'profile' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <UserRound size={17} />Profile
            </button>
            <button onClick={() => { setMobileOpen(false); onLogout(); }} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">
              <LogOut size={17} />Log out
            </button>
          </div>
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

  // Do NOT block here — render the hero h1 + search UI immediately.
  // The grid area below shows an inline spinner while items load.

  return (
    <div>
      <div className="mb-8 sm:mb-10 flex flex-col justify-between gap-4 sm:gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-700"><Sparkles size={14} /> Campus exchange</div>
          <h1 className="max-w-xl text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Borrow what you need.<br /><span className="text-sky-600">Lend what you can.</span></h1>
          <p className="mt-3 sm:mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-slate-500">A simpler way to share useful things with the people around you.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm w-fit">
          <div className="flex -space-x-2"><div className="h-8 w-8 rounded-full border-2 border-white bg-amber-100" /><div className="h-8 w-8 rounded-full border-2 border-white bg-sky-100" /><div className="h-8 w-8 rounded-full border-2 border-white bg-emerald-100" /></div>
          <div><p className="text-sm font-extrabold">{items.length} items</p><p className="text-xs text-slate-400">listed on campus</p></div>
        </div>
      </div>
      <div className="mb-7 flex flex-col gap-3.5 sm:gap-4">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" placeholder="Search for calculators, rackets, adapters..." />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['all', 'academics', 'electronics', 'sports', 'event_wear'] as const).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`min-h-[38px] whitespace-nowrap rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${category === cat ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'border border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-700'}`}>
              {cat === 'all' ? 'All items' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-extrabold">Available near you</h2>
        <span className="text-xs sm:text-sm font-semibold text-slate-400">{filtered.length} items</span>
      </div>
      {/* Grid — shows inline spinner while loading so the hero above is already visible */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoaderCircle size={28} className="animate-spin text-sky-400" />
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
  const isSell = item.listing_type === 'sell';

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/60 overflow-hidden">
      {/* Item image or category icon */}
      <div className="relative">
        {item.image_url ? (
          <div className="h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
            <img src={item.image_url} alt={item.equipment_name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          </div>
        ) : (
          <div className="flex h-44 sm:h-48 w-full items-center justify-center bg-slate-50">
            {item.category === 'electronics' ? <Laptop size={36} className="text-sky-300" /> : item.category === 'academics' ? <BookOpen size={36} className="text-sky-300" /> : item.category === 'sports' ? <Compass size={36} className="text-sky-300" /> : <Sparkles size={36} className="text-sky-300" />}
          </div>
        )}

        {/* Listing Type Tag on Image */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isSell ? (
            <span className="flex items-center gap-1 rounded-full bg-violet-600/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <Tag size={11} /> For Sale
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-teal-600/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <Clock size={11} /> For Rent
            </span>
          )}
        </div>

        {/* Quantity Badge */}
        {typeof item.quantity === 'number' && item.quantity > 0 && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm border border-slate-200/50">
              {item.quantity} in stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-start justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">{categoryLabels[item.category]}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${item.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span>
        </div>

        <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{item.equipment_name}</h3>

        {/* Pricing display */}
        <div className="mt-2.5">
          {isSell ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-slate-900 flex items-center">
                <IndianRupee size={16} />{item.sale_price != null ? item.sale_price : (item.price_note || 'Negotiable')}
              </span>
              <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                One-time purchase
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.rate_per_day != null && (
                <span className="inline-flex items-center gap-0.5 rounded-lg bg-teal-50 border border-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                  <IndianRupee size={11} />{item.rate_per_day}<span className="text-[10px] font-medium text-teal-600">/day</span>
                </span>
              )}
              {item.rate_per_month != null && (
                <span className="inline-flex items-center gap-0.5 rounded-lg bg-sky-50 border border-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                  <IndianRupee size={11} />{item.rate_per_month}<span className="text-[10px] font-medium text-sky-600">/mo</span>
                </span>
              )}
              {item.rate_per_semester != null && (
                <span className="inline-flex items-center gap-0.5 rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  <IndianRupee size={11} />{item.rate_per_semester}<span className="text-[10px] font-medium text-indigo-600">/sem</span>
                </span>
              )}
              {item.rate_per_day == null && item.rate_per_month == null && item.rate_per_semester == null && item.price_note && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <IndianRupee size={12} />
                  <span className="truncate">{item.price_note}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 flex-1 text-xs sm:text-sm text-slate-500">
          Listed by <span className="font-bold text-slate-700">{item.owner.full_name}</span> · Room {item.owner.room_number}
        </p>

        <div className="mt-4">
          {isOwn ? (
            <div className="w-full rounded-xl bg-slate-50 py-2.5 text-center text-xs sm:text-sm font-bold text-slate-400">Your listing</div>
          ) : requestStatus === 'pending' ? (
            <div className="flex gap-2">
              <div className="flex flex-1 items-center justify-center rounded-xl bg-amber-50 py-2.5 text-xs sm:text-sm font-bold text-amber-600">Request sent</div>
              <button
                onClick={() => onCancelRequest(item)}
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
                title="Cancel request"
              >
                <XCircle size={15} /> Cancel
              </button>
            </div>
          ) : (
            <button
              disabled={item.status !== 'available' || requestStatus === 'approved'}
              onClick={() => onRequest(item)}
              className={`min-h-[44px] w-full rounded-xl py-2.5 px-4 text-xs sm:text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                isSell ? 'bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/15' : 'bg-slate-900 hover:bg-sky-600'
              }`}
            >
              {item.status !== 'available'
                ? (isSell ? 'Sold out' : 'Currently borrowed')
                : requestStatus === 'approved'
                ? (isSell ? 'Purchased ✓' : 'Approved ✓')
                : (isSell ? 'Buy this item' : 'Request to borrow')}
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
  const [listingType, setListingType] = useState<ListingType>('rent');
  const [salePrice, setSalePrice] = useState('');
  const [rateDay, setRateDay] = useState('');
  const [rateMonth, setRateMonth] = useState('');
  const [rateSemester, setRateSemester] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [quantity, setQuantity] = useState(1);
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
      const {
        name: pName,
        category: pCat,
        imageUrl: pUrl,
        priceNote: pPrice,
        quantity: pQty,
        listingType: pType,
        salePrice: pSale,
        rateDay: pDay,
        rateMonth: pMonth,
        rateSemester: pSem,
      } = pendingAction.formData;
      clearPendingAction();
      doSubmit(pName, pCat, pUrl, pPrice, pQty, pType, pSale, pDay, pMonth, pSem);
    }
  }, [ownerProfile.room_number, pendingAction]);

  const doSubmit = async (
    itemName: string,
    itemCat: Category,
    itemImageUrl: string,
    itemPriceNote: string,
    itemQty: number,
    itemType: ListingType,
    itemSalePrice: string,
    itemRateDay: string,
    itemRateMonth: string,
    itemRateSemester: string,
  ) => {
    setError('');
    setLoading(true);
    try {
      const parsedSale = itemType === 'sell' && itemSalePrice.trim() ? parseFloat(itemSalePrice) : null;
      const parsedDay = itemType === 'rent' && itemRateDay.trim() ? parseFloat(itemRateDay) : null;
      const parsedMonth = itemType === 'rent' && itemRateMonth.trim() ? parseFloat(itemRateMonth) : null;
      const parsedSemester = itemType === 'rent' && itemRateSemester.trim() ? parseFloat(itemRateSemester) : null;

      const newItem = await api.createEquipment({
        equipment_name: itemName,
        category: itemCat,
        image_url: itemImageUrl,
        price_note: itemPriceNote || null,
        quantity: itemQty,
        listing_type: itemType,
        sale_price: parsedSale,
        rate_per_day: parsedDay,
        rate_per_month: parsedMonth,
        rate_per_semester: parsedSemester,
      });

      setMyItems((prev) => [newItem, ...prev]);
      showToast(itemType === 'sell' ? 'Item listed for sale 🎉' : 'Item added to campus library 🎉');

      // Reset form
      setName('');
      setQuantity(1);
      setPriceNote('');
      setSalePrice('');
      setRateDay('');
      setRateMonth('');
      setRateSemester('');
      setImageUrl('');
    } catch (err: any) {
      setError(err?.message || 'Failed to list item. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please provide what you are listing.');
      return;
    }
    if (!imageUrl) {
      setError('Please upload a photo of your item before listing.');
      return;
    }

    if (listingType === 'sell') {
      const p = parseFloat(salePrice);
      if (!salePrice.trim() || isNaN(p) || p <= 0) {
        setError('Please enter a valid selling price in ₹.');
        return;
      }
    } else {
      const d = parseFloat(rateDay);
      const m = parseFloat(rateMonth);
      const s = parseFloat(rateSemester);
      const hasRate = (!isNaN(d) && d >= 0) || (!isNaN(m) && m >= 0) || (!isNaN(s) && s >= 0);
      if (!hasRate && !priceNote.trim()) {
        setError('Please provide at least one rental rate (per day, month, or semester) or specify your terms.');
        return;
      }
    }

    const payloadData = {
      name: name.trim(),
      category,
      imageUrl,
      priceNote,
      quantity,
      listingType,
      salePrice,
      rateDay,
      rateMonth,
      rateSemester,
    };

    if (!requireProfile({ type: 'list', formData: payloadData })) return;
    await doSubmit(name.trim(), category, imageUrl, priceNote, quantity, listingType, salePrice, rateDay, rateMonth, rateSemester);
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
    <div className="mx-auto max-w-6xl px-2 sm:px-4 lg:px-6">
      {/* Top Navigation & Hero Banner */}
      <button
        onClick={onDone}
        className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-sky-600 hover:bg-slate-50"
      >
        <ChevronLeft size={16} /> Back to explore
      </button>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-indigo-50/40 p-6 sm:p-8 border border-sky-100/70 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-3 py-1 text-xs font-extrabold text-sky-800 mb-2.5">
              <Sparkles size={13} className="text-sky-600" />
              Campus Sharing & Marketplace
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Share or Sell an Item
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
              Turn unused equipment into campus goodwill or extra pocket money. Choose whether you are selling permanently or lending for a period.
            </p>
          </div>
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
            <PackagePlus size={30} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Wide Form */}
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT COLUMN: Basic Item Info & Photo ─────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Item Details */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <BookOpen size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Item Information</h2>
                <p className="text-xs text-slate-400">Describe the gear you are offering</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-bold text-slate-700">
                  What are you listing? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mini Drafter, Casio FX-991EX, Lab Coat, Football..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  required
                />
              </div>

              {/* Category Selector Buttons */}
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-bold text-slate-700">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: 'academics', label: 'Academics', icon: BookOpen },
                      { id: 'electronics', label: 'Electronics', icon: Laptop },
                      { id: 'sports', label: 'Sports', icon: Compass },
                      { id: 'event_wear', label: 'Event Wear', icon: Sparkles },
                    ] as const
                  ).map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 border text-center transition ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/80 text-sky-700 shadow-sm ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-sky-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Quantity Available
                  </label>
                  <span className="text-xs text-slate-400">Total units on hand</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 bg-transparent text-center text-sm font-extrabold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {quantity === 1 ? '1 student can borrow or buy' : `${quantity} students can borrow or buy`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Item Photo Upload */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Image size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Item Photo</h2>
                <p className="text-xs text-slate-400">Show peers the real condition of your item</p>
              </div>
            </div>
            <ImageUploader onUploaded={setImageUrl} userId={ownerId} />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Listing Type, Pricing & Live Preview ───── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Listing Type & Pricing */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Tag size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">3. Transaction Type & Pricing</h2>
                <p className="text-xs text-slate-400">Choose between lending or selling</p>
              </div>
            </div>

            {/* Segmented Selector for Sell vs Lend */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setListingType('rent')}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-4 border text-center transition ${
                  listingType === 'rent'
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900 shadow-sm ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${listingType === 'rent' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Clock size={20} />
                </div>
                <span className="text-sm font-extrabold">Lend / Rent</span>
                <span className="text-[11px] text-slate-500">For a fixed duration</span>
              </button>

              <button
                type="button"
                onClick={() => setListingType('sell')}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-4 border text-center transition ${
                  listingType === 'sell'
                    ? 'border-violet-500 bg-violet-50/60 text-violet-900 shadow-sm ring-2 ring-violet-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${listingType === 'sell' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ShoppingBag size={20} />
                </div>
                <span className="text-sm font-extrabold">Sell Item</span>
                <span className="text-[11px] text-slate-500">One-time purchase</span>
              </button>
            </div>

            {/* Conditional Pricing Section: SELL */}
            {listingType === 'sell' && (
              <div className="space-y-4 rounded-2xl bg-violet-50/40 p-4 border border-violet-100">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">
                    Selling Price <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g. 550"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-14 text-base sm:text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">INR</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Full ownership transfers upon sale.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Condition / Notes <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. In mint condition, used for 1 semester only"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs font-medium outline-none placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>
              </div>
            )}

            {/* Conditional Pricing Section: LEND / RENT */}
            {listingType === 'rent' && (
              <div className="space-y-4 rounded-2xl bg-teal-50/40 p-4 border border-teal-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">Rental Rates</label>
                  <span className="text-[11px] text-slate-500 font-medium">Enter any or all rates</span>
                </div>

                <div className="space-y-3">
                  {/* Per Day */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-teal-900 flex items-center gap-1">
                        <Clock size={12} className="text-teal-600" /> Daily Rate
                      </span>
                      <span className="text-[11px] text-slate-400">Short-term loan</span>
                    </div>
                    <div className="relative">
                      <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="e.g. 20"
                        value={rateDay}
                        onChange={(e) => setRateDay(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-14 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ day</span>
                    </div>
                  </div>

                  {/* Per Month */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                        <Calendar size={12} className="text-sky-600" /> Monthly Rate
                      </span>
                      <span className="text-[11px] text-slate-400">Mid-term project</span>
                    </div>
                    <div className="relative">
                      <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="e.g. 250"
                        value={rateMonth}
                        onChange={(e) => setRateMonth(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-14 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ mo</span>
                    </div>
                  </div>

                  {/* Per Semester */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                        <GraduationCap size={13} className="text-indigo-600" /> Semester Rate
                      </span>
                      <span className="text-[11px] text-slate-400">Full term course</span>
                    </div>
                    <div className="relative">
                      <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="e.g. 600"
                        value={rateSemester}
                        onChange={(e) => setRateSemester(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-14 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ sem</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Lending Terms / Deposit <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free for 2 days, ₹50 refundable deposit"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs font-medium outline-none placeholder:text-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card: Live Feed Preview */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                <Eye size={13} className="text-sky-500" /> Live Explore Preview
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Preview as peers see it</span>
            </div>

            {/* Mock Item Card Preview */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="relative h-36 bg-slate-100 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    {category === 'electronics' ? <Laptop size={32} /> : category === 'academics' ? <BookOpen size={32} /> : category === 'sports' ? <Compass size={32} /> : <Sparkles size={32} />}
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5">
                  {listingType === 'sell' ? (
                    <span className="flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      <Tag size={10} /> For Sale
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      <Clock size={10} /> For Rent
                    </span>
                  )}
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200">
                    {quantity} in stock
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-600 uppercase tracking-wide text-[10px]">{categoryLabels[category]}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Available</span>
                </div>
                <p className="font-extrabold text-slate-900 text-sm truncate">{name.trim() || 'Item Name'}</p>

                <div className="pt-1">
                  {listingType === 'sell' ? (
                    <div className="flex items-center gap-1 text-slate-900 font-extrabold text-sm">
                      <IndianRupee size={13} />{salePrice || '—'}
                      <span className="text-[10px] font-medium text-slate-400 ml-1">Buy now</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {rateDay && <span className="rounded bg-teal-50 px-1.5 py-0.5 text-teal-700 font-bold">₹{rateDay}/day</span>}
                      {rateMonth && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 font-bold">₹{rateMonth}/mo</span>}
                      {rateSemester && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 font-bold">₹{rateSemester}/sem</span>}
                      {!rateDay && !rateMonth && !rateSemester && (
                        <span className="text-slate-400 text-xs italic">Set rental rates above</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submission and Error area */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-3.5 px-6 text-sm font-extrabold text-white shadow-xl shadow-sky-600/25 transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <PackagePlus size={18} />}
            {listingType === 'sell' ? 'Publish Sale Listing' : 'Publish Rental Listing'}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>

      {/* ── My Listings Section (Wide Grid) ────────────────────────── */}
      <div className="mt-16 border-t border-slate-200/80 pt-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Your Listings</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Items and equipment you have published on campus</p>
          </div>
          {myItems.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-extrabold text-sky-700 self-start sm:self-auto">
              <CheckCircle2 size={13} className="text-sky-500" />
              {myItems.length} active listing{myItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {myItemsLoading ? (
          <CenteredSpinner />
        ) : myItems.length === 0 ? (
          <Empty icon={<PackagePlus size={24} />} title="No listings yet" text="Items you add above will appear here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myItems.map((item) => {
              const isSell = item.listing_type === 'sell';
              return (
                <div
                  key={item.equipment_id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md hover:border-slate-300"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.equipment_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                        <Image size={28} />
                      </div>
                    )}
                    {/* Tag for sell vs rent */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      {isSell ? (
                        <span className="flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                          <Tag size={10} /> For Sale
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                          <Clock size={10} /> For Rent
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 shadow-sm border border-slate-200">
                        {item.quantity || 1} in stock
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4 justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wide">
                          {categoryLabels[item.category]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            item.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1">
                        {item.equipment_name}
                      </h3>

                      {/* Pricing summary */}
                      <div className="mt-2">
                        {isSell ? (
                          <div className="flex items-center gap-1 text-slate-900 font-extrabold text-sm">
                            <IndianRupee size={13} />
                            {item.sale_price != null ? item.sale_price : (item.price_note || 'Negotiable')}
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full ml-1">
                              Sale
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {item.rate_per_day != null && (
                              <span className="rounded bg-teal-50 border border-teal-100 px-1.5 py-0.5 text-teal-700 font-bold">
                                ₹{item.rate_per_day}/day
                              </span>
                            )}
                            {item.rate_per_month != null && (
                              <span className="rounded bg-sky-50 border border-sky-100 px-1.5 py-0.5 text-sky-700 font-bold">
                                ₹{item.rate_per_month}/mo
                              </span>
                            )}
                            {item.rate_per_semester != null && (
                              <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-indigo-700 font-bold">
                                ₹{item.rate_per_semester}/sem
                              </span>
                            )}
                            {item.rate_per_day == null && item.rate_per_month == null && item.rate_per_semester == null && item.price_note && (
                              <span className="text-amber-600 font-semibold truncate flex items-center">
                                <IndianRupee size={11} /> {item.price_note}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(item.equipment_id)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 py-1 px-2 rounded-lg hover:bg-rose-50 transition"
                        title="Remove listing"
                      >
                        <Trash2 size={14} /> Remove Listing
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
      <div className="mb-6 sm:mb-8">
        <p className="mb-1 sm:mb-2 text-xs sm:text-sm font-bold text-sky-600">Your activity</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">Keep track of your lending and borrowing.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Outgoing requests */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-base sm:text-lg font-extrabold">My requests</h2>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">Items you asked to borrow</p>
          </div>
          {outgoing.length ? (
            <div className="space-y-3">
              {outgoing.map((request) => (
                <div key={request.request_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 sm:p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold">{request.equipment.equipment_name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Owner: {request.owner.full_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                    <StatusBadge status={request.status} />
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOutgoing(request.request_id)}
                        className="flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-base sm:text-lg font-extrabold">Requests for my items</h2>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">People waiting for your approval</p>
          </div>
          {incoming.length ? (
            <div className="space-y-3">
              {incoming.map((request) => (
                <div key={request.request_id} className="rounded-2xl bg-slate-50 p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold truncate">{request.equipment.equipment_name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{request.borrower.full_name} · Room {request.borrower.room_number}</p>
                      {request.borrower.phone_number && (
                        <p className="mt-0.5 text-xs text-slate-400">📞 {request.borrower.phone_number}</p>
                      )}
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  {request.status === 'pending' && (
                    <div className="mt-3.5 flex gap-2">
                      <button onClick={() => handleUpdate(request.request_id, 'approved')} className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-extrabold text-white hover:bg-emerald-600"><Check size={14} />Approve</button>
                      <button onClick={() => handleUpdate(request.request_id, 'rejected')} className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-extrabold text-slate-500 hover:border-rose-200 hover:text-rose-600"><XCircle size={14} />Decline</button>
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

function ProfilePage({
  profile,
  setProfile,
  showToast,
  userEmail,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  showToast: (msg: string) => void;
  userEmail?: string;
}) {
  const parsed = useMemo(() => parsePecEmail(userEmail || ''), [userEmail]);
  const degree = profile.degree || parsed.degree || 'B.Tech';
  const branch = profile.branch || parsed.branchName || parsed.branchCode || 'PEC';
  const batchYear = profile.batch_year || parsed.batchYear || '2025';

  const [fullName, setFullName] = useState(profile.full_name || parsed.formattedName);
  const [studentId, setStudentId] = useState(profile.student_id || '');
  const [phone, setPhone] = useState(profile.phone_number || '');
  const [residenceType, setResidenceType] = useState<'hosteller' | 'day_scholar'>(
    profile.residence_type === 'day_scholar' ? 'day_scholar' : 'hosteller'
  );
  const [hostel, setHostel] = useState(profile.hostel_name || '');
  const [room, setRoom] = useState(profile.room_number || '');
  const [address, setAddress] = useState(profile.address || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');

    const cleanSid = studentId.trim();
    if (cleanSid && !/^\d{8}$/.test(cleanSid)) {
      setError('Student ID (SID) must be exactly 8 digits');
      return;
    }

    if (residenceType === 'hosteller' && (!hostel || !room.trim())) {
      setError('Please provide your PEC hostel and room number');
      return;
    }

    if (residenceType === 'day_scholar' && !address.trim()) {
      setError('Please provide your residential locality / address');
      return;
    }

    setSaving(true);
    try {
      const data = await api.updateMyProfile({
        full_name: fullName.trim(),
        student_id: cleanSid,
        phone_number: phone.trim(),
        degree,
        batch_year: batchYear,
        branch,
        residence_type: residenceType,
        hostel_name: residenceType === 'hosteller' ? hostel : '',
        room_number: residenceType === 'hosteller' ? room.trim() : '',
        address: residenceType === 'day_scholar' ? address.trim() : '',
      });
      setProfile(data);
      showToast('Profile changes saved');
    } catch (err: any) {
      setError(err?.message || 'Could not save profile. Please try again.');
      showToast(err?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <p className="mb-1 sm:mb-2 text-xs sm:text-sm font-bold text-sky-600">Your account</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Profile</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">Keep your details up to date for easy handoffs.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-sky-100 text-lg sm:text-xl font-extrabold text-sky-700 shrink-0">
            {getInitials(fullName)}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{fullName || 'Your name'}</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                PEC Verified
              </span>
            </div>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              {degree} {branch} • Batch of {batchYear}
            </p>
            {userEmail && <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>}
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        <div className="space-y-4 sm:space-y-5">
          <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <div>
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <label className="text-xs sm:text-sm font-bold text-slate-700">Student ID (SID)</label>
              <span className={`text-xs ${studentId.length === 8 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                {studentId.length}/8 digits
              </span>
            </div>
            <input
              type="text"
              placeholder="Enter 8-digit SID"
              value={studentId}
              maxLength={8}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700">Phone number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700">Campus Residence</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 mb-3">
              <button
                type="button"
                onClick={() => setResidenceType('hosteller')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition ${
                  residenceType === 'hosteller' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                Hosteller
              </button>
              <button
                type="button"
                onClick={() => setResidenceType('day_scholar')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition ${
                  residenceType === 'day_scholar' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapPin size={15} />
                Day Scholar
              </button>
            </div>

            {residenceType === 'hosteller' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">PEC Hostel</label>
                  <select
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base sm:text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  >
                    <option value="">Select hostel...</option>
                    {PEC_HOSTELS.map((h) => (
                      <option key={h} value={h}>
                        {h} Hostel
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Room number</label>
                  <input
                    type="text"
                    placeholder="e.g. 204-B"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700">Locality / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 15-D, Chandigarh"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 sm:mt-8 flex min-h-[46px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-70"
        >
          {saving && <LoaderCircle size={17} className="animate-spin" />}
          Save changes <Check size={17} />
        </button>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-700">
        <ShieldCheck size={20} className="shrink-0" />
        <p>
          <span className="font-extrabold">Your details are verified by PEC domain.</span> Only your name and room/location are shown when you list an item to peers.
        </p>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 sm:px-6 py-10 sm:py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">{icon}</div>
      <h3 className="text-sm font-extrabold">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Field({ label, type = 'text', placeholder, value, onChange, required }: { label: string; type?: string; placeholder?: string; value?: string; onChange?: (event: ChangeEvent<HTMLInputElement>) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-bold text-slate-700">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
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
