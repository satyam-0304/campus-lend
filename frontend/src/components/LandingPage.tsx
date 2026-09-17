import { useState } from 'react';
import {
  BookOpen,
  Laptop,
  Trophy,
  Package,
  Sparkles,
  Search,
  Send,
  CheckCircle2,
  Wallet,
  GraduationCap,
  ShieldCheck,
  Recycle,
  Star,
  ArrowRight,
  Menu,
  X,
  Layers,
  HeartHandshake,
  Shirt,
  ShoppingBag,
  Tag,
  Coins,
  Repeat,
  BadgeCheck,
  Building2,
  TrendingUp,
  UserCheck,
  Zap,
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const [menuPanelOpen, setMenuPanelOpen] = useState(false);
  const [howItWorksTab, setHowItWorksTab] = useState<'all' | 'buysell' | 'borrow'>('all');

  const scrollToSection = (id: string) => {
    setMenuPanelOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-800" id="top">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-6 sm:px-10 lg:px-12">
          {/* Left: Brand */}
          <a href="#top" className="flex items-center gap-3.5 group shrink-0">
            <div className="h-10 w-10 overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-slate-200/80 transition group-hover:ring-sky-400 group-hover:shadow-md">
              <img src="/assets/images/logo.jpeg" alt="CampusLend Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Campus<span className="text-sky-600">Lend</span>
            </span>
          </a>

          {/* Center/Left Navigation (Spacious & Clean) */}
          <nav className="hidden items-center gap-2 lg:flex xl:gap-4">
            <button
              onClick={() => scrollToSection('top')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-sky-50/70 hover:text-sky-600 transition duration-150"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('marketplace')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-sky-50/70 hover:text-sky-600 transition duration-150"
            >
              Marketplace
            </button>
            <button
              onClick={() => scrollToSection('borrow-lend')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-sky-50/70 hover:text-sky-600 transition duration-150"
            >
              Borrow & Lend
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-sky-50/70 hover:text-sky-600 transition duration-150"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-sky-50/70 hover:text-sky-600 transition duration-150"
            >
              About
            </button>
          </nav>

          {/* Right side: Auth controls + Polished Menu Button */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              onClick={onLogin}
              className="hidden sm:block rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition duration-150"
            >
              Log in
            </button>
            <button
              onClick={onSignUp}
              className="hidden sm:block rounded-full bg-sky-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 hover:shadow-md hover:shadow-sky-600/30 active:scale-95 transition duration-150"
            >
              Sign up
            </button>
            <button
              onClick={() => setMenuPanelOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 shadow-sm hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md active:scale-95 transition duration-150"
              aria-label="Open navigation menu"
            >
              <Menu size={18} className="text-sky-600" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. PREMIUM NAVIGATION PANEL */}
      {menuPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMenuPanelOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-md flex-col justify-between overflow-y-auto bg-white p-6 shadow-2xl ring-1 ring-slate-200/80 sm:p-7 sm:rounded-l-3xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-slate-200">
                    <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">CampusLend</h2>
                    <p className="text-xs text-slate-500 font-medium">Your campus marketplace</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuPanelOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Marketplace Options (Two Featured Cards) */}
              <div className="mb-6 grid gap-3">
                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('marketplace'); }}
                  className="group flex items-start gap-3.5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-left transition hover:border-sky-300 hover:bg-white hover:shadow-md hover:shadow-sky-100/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm group-hover:scale-105 transition">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">Core Feature</span>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">BUY & SELL</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Buy products you need or sell what you no longer use.</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('borrow-lend'); }}
                  className="group flex items-start gap-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-left transition hover:border-amber-300 hover:bg-white hover:shadow-md hover:shadow-amber-100/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm group-hover:scale-105 transition">
                    <Repeat size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Core Feature</span>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition">BORROW & LEND</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Borrow something temporarily or lend items to fellow students.</p>
                  </div>
                </button>
              </div>

              {/* Navigation Links with Descriptions */}
              <div className="space-y-1 py-2 border-t border-slate-100">
                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('top'); }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition">
                    <Compass size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">Home</span>
                    <span className="block text-[11px] text-slate-400">Return to top of page</span>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('marketplace'); }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition">
                    <Layers size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">Explore Marketplace</span>
                    <span className="block text-[11px] text-slate-400">Find products to buy or borrow</span>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('how-it-works'); }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition">
                    <Zap size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">How It Works</span>
                    <span className="block text-[11px] text-slate-400">See how CampusLend works</span>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuPanelOpen(false); scrollToSection('about'); }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition">
                    <HeartHandshake size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">About</span>
                    <span className="block text-[11px] text-slate-400">Learn about our campus community</span>
                  </div>
                </button>
              </div>

              {/* Primary CTA Card */}
              <div className="mt-5 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50/50 p-4">
                <p className="text-xs font-bold text-slate-600 mb-2">Sell or lend something to your campus community.</p>
                <button
                  onClick={() => { setMenuPanelOpen(false); onSignUp(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-extrabold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700"
                >
                  List an Item
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Bottom Auth Section */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setMenuPanelOpen(false); onLogin(); }}
                  className="rounded-xl border border-slate-200 py-3 text-center text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setMenuPanelOpen(false); onSignUp(); }}
                  className="rounded-xl bg-sky-600 py-3 text-center text-xs font-extrabold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-700 shadow-sm">
                <Sparkles size={14} className="text-sky-600" />
                <span>Your Campus Marketplace, Made Simple.</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                Buy what you need.<br />
                <span className="text-sky-600">Sell what you don't.</span><br />
                <span className="text-slate-700 text-3xl sm:text-4xl lg:text-5xl font-bold">Borrow what's temporary.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl font-normal">
                CampusLend connects students on the same campus to buy, sell, borrow, and lend useful items — making student life more affordable, convenient, and sustainable.
              </p>

              {/* TWO CLEAR PRIMARY ACTIONS */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                
                {/* Action Card 1: BUY & SELL */}
                <div className="group rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-md shadow-slate-100 transition hover:border-sky-500 hover:shadow-xl hover:shadow-sky-50">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
                    <ShoppingBag size={24} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Buy & Sell</span>
                  <h3 className="mt-1 text-lg font-extrabold text-slate-900">Find it. Buy it. Sell it.</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Buy products from fellow students or sell items you no longer need.
                  </p>
                  <button
                    onClick={() => scrollToSection('marketplace')}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
                  >
                    Explore Marketplace
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Action Card 2: BORROW & LEND */}
                <div className="group rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-md shadow-slate-100 transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-50">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition">
                    <Repeat size={24} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Borrow & Lend</span>
                  <h3 className="mt-1 text-lg font-extrabold text-slate-900">Need it temporarily?</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Borrow useful items for a short period or lend items you already own.
                  </p>
                  <button
                    onClick={() => scrollToSection('borrow-lend')}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-extrabold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700"
                  >
                    Browse Items to Borrow
                    <ArrowRight size={15} />
                  </button>
                </div>

              </div>

              {/* Trust Badge Bar */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-200/70 pt-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <span>Verified Campus Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-sky-500" />
                  <span>On-Campus Handshake</span>
                </div>
              </div>
            </div>

            {/* Right Visual Element (Showcase Grid) */}
            {/* Right Visual Element (Campus Marketplace Hub Card) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative Blur Backdrops */}
                <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

                {/* Card Showcase Grid */}
                <div className="relative grid grid-cols-2 gap-4 p-2">

                  {/* Showcase Card 1 */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                          <BookOpen size={22} />
                        </div>
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sky-700">
                          FOR SALE
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">Scientific Calculator</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Casio FX-991EX</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <span className="font-extrabold text-slate-900">₹800</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.9</span>
                    </div>
                  </div>

                  {/* Showcase Card 2 */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Laptop size={22} />
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                          TO BORROW
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">Arduino Uno Kit</h3>
                      <p className="mt-0.5 text-xs text-slate-500">USB Cable + Sensors</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <span className="font-extrabold text-slate-900">₹30/day</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 5.0</span>
                    </div>
                  </div>

                  {/* Showcase Card 3 */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <BookOpen size={22} />
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
                          FOR SALE
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">Engineering Books</h3>
                      <p className="mt-0.5 text-xs text-slate-500">3rd Sem Bundle</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <span className="font-extrabold text-slate-900">₹500</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.8</span>
                    </div>
                  </div>

                  {/* Showcase Card 4 */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                          <Shirt size={22} />
                        </div>
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
                          BUY OR BORROW
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">Chemistry Lab Coat</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Size M · Clean</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <span className="font-extrabold text-slate-900">₹400 / ₹30d</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.9</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Community Stat */}
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 border border-slate-200/50 mx-2">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={18} className="text-sky-600" />
                    <span>Verified campus members only</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHAT ARE YOU LOOKING FOR TODAY? */}
      <section className="py-16 bg-white border-y border-slate-200/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Intentions</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              What are you looking for today?
            </h2>
            <p className="mt-2 text-slate-500 text-sm">
              Choose your goal to explore campus marketplace options.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            
            {/* BUY */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-7 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
                <ShoppingBag size={26} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Purchase</span>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">BUY</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Find something you want to own permanently from fellow students.
              </p>
              <button
                onClick={() => scrollToSection('marketplace')}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
              >
                Explore Marketplace
              </button>
            </div>

            {/* SELL */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-7 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                <Coins size={26} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Earn</span>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">SELL</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Turn your unused items into money by selling to peers.
              </p>
              <button
                onClick={onSignUp}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white transition hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Sell an Item
              </button>
            </div>

            {/* BORROW */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-7 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                <Repeat size={26} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Temporary</span>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">BORROW</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Get something you need temporarily without buying.
              </p>
              <button
                onClick={() => scrollToSection('borrow-lend')}
                className="mt-6 w-full rounded-xl bg-amber-600 py-3 text-xs font-extrabold text-white transition hover:bg-amber-700 shadow-md shadow-amber-600/20"
              >
                Browse Rentals
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 4. WARM WELCOME / COMMUNITY MESSAGE */}
      <section id="about" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <HeartHandshake size={26} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Made for students, by the campus community.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 font-medium">
            Why buy something new when you can buy pre-loved from a senior or borrow it for a few days? CampusLend helps students share resources, save money, reduce unnecessary purchases, and make better use of what already exists on campus.
          </p>
        </div>
      </section>

      {/* 5. HOW IT WORKS (DUAL FLOWS) */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Simple & Direct</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How CampusLend Works
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              Clear process whether you want to buy/sell permanently or borrow/lend temporarily.
            </p>

            {/* Filter Tabs */}
            <div className="mt-8 inline-flex rounded-2xl bg-slate-100 p-1.5">
              <button
                onClick={() => setHowItWorksTab('all')}
                className={`rounded-xl px-5 py-2 text-xs font-extrabold transition ${
                  howItWorksTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Flows
              </button>
              <button
                onClick={() => setHowItWorksTab('buysell')}
                className={`rounded-xl px-5 py-2 text-xs font-extrabold transition ${
                  howItWorksTab === 'buysell' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Buy & Sell Flow
              </button>
              <button
                onClick={() => setHowItWorksTab('borrow')}
                className={`rounded-xl px-5 py-2 text-xs font-extrabold transition ${
                  howItWorksTab === 'borrow' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Borrow & Lend Flow
              </button>
            </div>
          </div>

          <div className="space-y-16">
            
            {/* FLOW 1: BUY & SELL */}
            {(howItWorksTab === 'all' || howItWorksTab === 'buysell') && (
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Model 1</span>
                    <h3 className="text-xl font-extrabold text-slate-900">BUY & SELL (Permanent Purchase)</h3>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-sky-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-extrabold text-lg shadow-md shadow-sky-600/30">
                      1
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Browse</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Find products listed by students across your campus.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-sky-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-extrabold text-lg shadow-md shadow-sky-600/30">
                      2
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Connect</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      View seller profile, item condition, and room details.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-sky-100 bg-sky-50/50 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-sky-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-extrabold text-lg shadow-md shadow-sky-600/30">
                      3
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Buy & Sell</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Arrange handoff and payment directly with the student.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FLOW 2: BORROW & LEND */}
            {(howItWorksTab === 'all' || howItWorksTab === 'borrow') && (
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Repeat size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Model 2</span>
                    <h3 className="text-xl font-extrabold text-slate-900">BORROW & LEND (Temporary Use)</h3>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-amber-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold text-lg shadow-md shadow-amber-500/30">
                      1
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Find</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Search for an item you only need for a short period.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-amber-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold text-lg shadow-md shadow-amber-500/30">
                      2
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Request</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Select your required dates and send a borrow request.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-7 transition hover:bg-white hover:shadow-xl hover:shadow-amber-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold text-lg shadow-md shadow-amber-500/30">
                      3
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900">Borrow & Return</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Collect the item, use it responsibly, and return it on time.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 6. EXPLORE CATEGORIES */}
      <section id="categories" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Campus Inventory</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What can you find on campus?
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              Explore items available for purchase or short-term borrowing.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Category 1 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition duration-200">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Academics</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Books, calculators, lab equipment and study essentials.
              </p>
            </div>

            {/* Category 2 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-200">
                <Laptop size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Electronics</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tech, accessories and gadgets for purchase or temporary use.
              </p>
            </div>

            {/* Category 3 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition duration-200">
                <Trophy size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Sports</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Sports equipment for games, practice or occasional use.
              </p>
            </div>

            {/* Category 4 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition duration-200">
                <Package size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Daily Essentials</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Useful everyday products from students around your campus.
              </p>
            </div>

            {/* Category 5 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition duration-200">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Event Wear</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Formal and event clothing without unnecessary purchases.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FEATURED ITEMS PREVIEW */}
      <section id="marketplace" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Live Listings</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Popular on Campus
              </h2>
              <p className="text-slate-500 text-sm mt-1">Browse buy/sell listings and items available to borrow</p>
            </div>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700 transition"
            >
              View full marketplace
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Featured Item Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" id="borrow-lend">
            
            {/* Card 1: Scientific Calculator (FOR SALE) */}
            <article className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <BookOpen size={24} />
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sky-700">
                    FOR SALE
                  </span>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">Academics</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition">Scientific Calculator</h3>
                <p className="mt-1 text-xs text-slate-500">Casio FX-991EX · Rahul (Room 302)</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Selling Price</span>
                    <span className="text-base font-extrabold text-slate-900">₹800</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    4.9
                  </span>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white transition hover:bg-sky-600"
                >
                  View Item
                </button>
              </div>
            </article>

            {/* Card 2: Arduino Uno Kit (AVAILABLE TO BORROW) */}
            <article className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Laptop size={24} />
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                    TO BORROW
                  </span>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Electronics</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition">Arduino Uno Kit</h3>
                <p className="mt-1 text-xs text-slate-500">USB Cable + Sensors · Sneha (Room 108)</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Borrow Rate</span>
                    <span className="text-base font-extrabold text-slate-900">₹30 <span className="text-xs font-normal text-slate-500">/ day</span></span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    5.0
                  </span>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-white transition hover:bg-amber-600 shadow-sm"
                >
                  Borrow
                </button>
              </div>
            </article>

            {/* Card 3: Engineering Books (FOR SALE) */}
            <article className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <BookOpen size={24} />
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sky-700">
                    FOR SALE
                  </span>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">Academics</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition">Engineering Books</h3>
                <p className="mt-1 text-xs text-slate-500">3rd Sem Set · Amit (Room 405)</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Selling Price</span>
                    <span className="text-base font-extrabold text-slate-900">₹500</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    4.8
                  </span>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white transition hover:bg-sky-600"
                >
                  View Item
                </button>
              </div>
            </article>

            {/* Card 4: Football (AVAILABLE TO BORROW) */}
            <article className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Trophy size={24} />
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                    TO BORROW
                  </span>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Sports</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition">Match Football</h3>
                <p className="mt-1 text-xs text-slate-500">Size 5 Leather · Varun (Room 412)</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Borrow Rate</span>
                    <span className="text-base font-extrabold text-slate-900">₹20 <span className="text-xs font-normal text-slate-500">/ day</span></span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    4.8
                  </span>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-white transition hover:bg-amber-600 shadow-sm"
                >
                  Borrow
                </button>
              </div>
            </article>

            {/* Card 5: Lab Coat (BUY OR BORROW) */}
            <article className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1.5 hover:border-purple-300 hover:shadow-xl hover:shadow-slate-200/60 sm:col-span-2 lg:col-span-1">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                    <Shirt size={24} />
                  </div>
                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
                    BUY OR BORROW
                  </span>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">Academics</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition">Chemistry Lab Coat</h3>
                <p className="mt-1 text-xs text-slate-500">Size M · Ananya (Room 215)</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Buy / Borrow</span>
                    <span className="text-xs font-extrabold text-slate-900 block">₹400 / ₹30d</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    4.9
                  </span>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-extrabold text-white transition hover:bg-sky-600"
                >
                  View Item
                </button>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* 8. TRUST / COMMUNITY BENEFITS */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Why CampusLend?</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Why students use CampusLend
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              A peer-to-peer campus marketplace designed specifically for student needs.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Benefit 1 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Wallet size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">SAVE MONEY</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Buy from fellow students at discounted prices or borrow instead of purchasing something you'll rarely use.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Coins size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">EARN FROM UNUSED ITEMS</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Sell things you no longer need or lend your equipment to earn cash directly on campus.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">CAMPUS COMMUNITY</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Connect with people from your own college community for quick and easy hostel handoffs.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">TRUSTED TRANSACTIONS</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Profiles, ratings and trust scores help build a reliable campus marketplace.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:col-span-2 lg:col-span-2">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Recycle size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">SUSTAINABLE CHOICES</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Keep useful products circulating instead of letting them sit unused or throwing them away at graduation.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-r from-sky-600 via-sky-700 to-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Sparkles size={28} className="text-sky-200" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Have something to offer?
          </h2>

          <p className="mt-4 text-sky-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Sell something you no longer need, lend something that could help someone, or find your next useful item right here on campus.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('marketplace')}
              className="rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-sky-800 shadow-xl shadow-sky-950/20 transition hover:bg-sky-50 active:scale-95"
            >
              Buy Something
            </button>

            <button
              onClick={onSignUp}
              className="rounded-2xl bg-emerald-500 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-600 active:scale-95"
            >
              Sell an Item
            </button>

            <button
              onClick={onSignUp}
              className="rounded-2xl border-2 border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              Lend an Item
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            
            {/* Brand column */}
            <div className="max-w-sm">
              <a href="#top" className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-xl bg-sky-50 ring-1 ring-slate-200">
                  <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  Campus<span className="text-sky-600">Lend</span>
                </span>
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                The student campus marketplace to buy, sell, borrow, and lend resources within your college community.
              </p>
            </div>

            {/* Links column */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-bold text-slate-600">
              <button onClick={() => scrollToSection('top')} className="hover:text-sky-600 transition">
                Home
              </button>
              <button onClick={() => scrollToSection('marketplace')} className="hover:text-sky-600 transition">
                Marketplace
              </button>
              <button onClick={() => scrollToSection('borrow-lend')} className="hover:text-sky-600 transition">
                Borrow & Lend
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-sky-600 transition">
                How It Works
              </button>
              <button onClick={() => scrollToSection('about')} className="hover:text-sky-600 transition">
                About
              </button>
              <button onClick={onLogin} className="hover:text-sky-600 transition">
                Log in
              </button>
              <button onClick={onSignUp} className="hover:text-sky-600 transition">
                Sign up
              </button>
            </div>

          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} CampusLend. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Empowering student campus communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
