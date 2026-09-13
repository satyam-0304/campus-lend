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
  Clock,
  Shirt,
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-800" id="top">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Left: Brand */}
          <a href="#top" className="flex items-center gap-3 group">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-sky-50 ring-1 ring-slate-200 transition group-hover:ring-sky-400">
              <img src="/assets/images/logo.jpeg" alt="CampusLend Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Campus<span className="text-sky-600">Lend</span>
            </span>
          </a>

          {/* Center/Left Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => scrollToSection('top')}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('explore-items')}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Explore
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              About
            </button>
          </nav>

          {/* Right side: Auth controls */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onLogin}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-sky-700 transition"
            >
              Log in
            </button>
            <button
              onClick={onSignUp}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition"
            >
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => scrollToSection('top')}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('explore-items')}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Explore
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                About
              </button>
              <div className="my-2 h-px bg-slate-100" />
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                  className="w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onSignUp(); }}
                  className="w-full rounded-xl bg-sky-600 py-3 text-center text-sm font-extrabold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700"
                >
                  Sign up
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-700 shadow-sm">
                <Sparkles size={14} className="text-sky-600" />
                <span>Welcome to CampusLend</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                Borrow what you need.<br />
                <span className="text-sky-600">Lend what you don't.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                CampusLend makes it easy for students to borrow useful items from their campus community and lend the things they already have.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => scrollToSection('explore-items')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 hover:shadow-sky-600/35 active:scale-[0.98]"
                >
                  Explore Items
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={onSignUp}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-7 py-3.5 text-base font-bold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700 active:scale-[0.98]"
                >
                  List an Item
                </button>
              </div>

              {/* Trust Badge Bar */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-200/70 pt-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <span>100% Student Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake size={18} className="text-sky-500" />
                  <span>Zero Rent Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-amber-500" />
                  <span>On-Campus Handoffs</span>
                </div>
              </div>
            </div>

            {/* Right Visual Element (Item Card Showcase Collage) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative Blur Backdrops */}
                <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

                {/* Card Showcase Grid */}
                <div className="relative grid grid-cols-2 gap-4 p-2">

                  {/* Showcase Card 1 */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <BookOpen size={22} />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                      Available
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">Scientific Calculator</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Casio FX-991EX</p>
                    <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                      <span className="font-semibold text-sky-700">Academics</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.9</span>
                    </div>
                  </div>

                  {/* Showcase Card 2 */}
                  <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <Laptop size={22} />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                      Available
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">HDMI Adapter & Cable</h3>
                    <p className="text-xs text-slate-500 mt-0.5">USB-C Multiport</p>
                    <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                      <span className="font-semibold text-sky-700">Electronics</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 5.0</span>
                    </div>
                  </div>

                  {/* Showcase Card 3 */}
                  <div className="-mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Trophy size={22} />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                      Available
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">Badminton Set</h3>
                    <p className="text-xs text-slate-500 mt-0.5">2 Rackets + Shuttle</p>
                    <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                      <span className="font-semibold text-sky-700">Sports</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.8</span>
                    </div>
                  </div>

                  {/* Showcase Card 4 */}
                  <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/50 transition hover:-translate-y-1">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <Shirt size={22} />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                      Available
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">Formal Blazer</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Navy Blue · Size L</p>
                    <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                      <span className="font-semibold text-sky-700">Event Wear</span>
                      <span className="flex items-center gap-1 font-bold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.9</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WARM WELCOME / COMMUNITY MESSAGE */}
      <section id="about" className="py-16 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 border-y border-slate-200/60">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <HeartHandshake size={26} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Made for students, by the campus community.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 font-medium">
            Why buy something you'll only need for a few days? CampusLend helps students share resources, save money, reduce unnecessary purchases, and make better use of what already exists on campus.
          </p>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-2">Simple & Easy Process</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              Borrowing and lending on campus takes just 3 simple steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                <Search size={28} />
              </div>
              <span className="mb-2 inline-block text-xs font-extrabold uppercase tracking-wider text-sky-600">Step 1</span>
              <h3 className="text-xl font-extrabold text-slate-900">Find what you need</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Browse items available from students on your campus.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                <Send size={28} />
              </div>
              <span className="mb-2 inline-block text-xs font-extrabold uppercase tracking-wider text-amber-600">Step 2</span>
              <h3 className="text-xl font-extrabold text-slate-900">Request to borrow</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Choose your dates and send a borrowing request.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 text-center transition hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={28} />
              </div>
              <span className="mb-2 inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-600">Step 3</span>
              <h3 className="text-xl font-extrabold text-slate-900">Borrow & return</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Pick up the item, use it responsibly, and return it on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPLORE CATEGORIES */}
      <section id="categories" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-2">Campus Inventory</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What can you borrow?
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              Discover everyday essentials listed by students near you.
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
                Calculators, books, lab equipment and more.
              </p>
            </div>

            {/* Category 2 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-200">
                <Laptop size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Electronics</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Useful tech and accessories for short-term needs.
              </p>
            </div>

            {/* Category 3 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition duration-200">
                <Trophy size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Sports</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Gear for practice, games and activities.
              </p>
            </div>

            {/* Category 4 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition duration-200">
                <Package size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Daily Essentials</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Everyday items when you need them.
              </p>
            </div>

            {/* Category 5 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition duration-200">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Event Wear</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Look your best without buying something you'll rarely use.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TRUST / COMMUNITY BENEFITS */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-2">Why CampusLend?</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Built for campus trust & convenience
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              A safer, smarter alternative to buying new equipment every semester.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Benefit 1 */}
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Save Money</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Borrow instead of buying items you only need temporarily.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Built Around Campus</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Connect with students within your own college community.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Trust Matters</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                User ratings and trust scores help create a safer lending community.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Recycle size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Share More, Waste Less</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Make better use of items that would otherwise sit unused.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FEATURED ITEMS PREVIEW */}
      <section id="explore-items" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-1">Campus Favorites</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Popular on Campus
              </h2>
            </div>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700 transition"
            >
              Browse all items
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Mock Featured Item Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Card 1 */}
            <article className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <BookOpen size={28} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
              <div className="mb-6 flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Academics</span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition">Scientific Calculator</h3>
                <p className="mt-1 text-xs text-slate-500">Free campus share · Room 302</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
              >
                View Item
              </button>
            </article>

            {/* Card 2 */}
            <article className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Laptop size={28} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  5.0
                </span>
              </div>
              <div className="mb-6 flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Electronics</span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition">Arduino Uno Kit</h3>
                <p className="mt-1 text-xs text-slate-500">Free campus share · Room 108</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
              >
                View Item
              </button>
            </article>

            {/* Card 3 */}
            <article className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Trophy size={28} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  4.8
                </span>
              </div>
              <div className="mb-6 flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Sports</span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition">Match Football</h3>
                <p className="mt-1 text-xs text-slate-500">Free campus share · Room 412</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
              >
                View Item
              </button>
            </article>

            {/* Card 4 */}
            <article className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Layers size={28} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
              <div className="mb-6 flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">Academics</span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition">Chemistry Lab Coat</h3>
                <p className="mt-1 text-xs text-slate-500">Free campus share · Room 215</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-sky-600"
              >
                View Item
              </button>
            </article>

          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-r from-sky-600 to-sky-700 text-white">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Sparkles size={28} className="text-sky-200" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Have something others might need?
          </h2>

          <p className="mt-4 text-sky-100 text-base sm:text-lg max-w-2xl mx-auto">
            Turn unused items into useful resources for someone on your campus.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onSignUp}
              className="w-full sm:w-auto rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-sky-700 shadow-xl shadow-sky-900/20 transition hover:bg-sky-50 active:scale-95"
            >
              List an Item
            </button>

            <button
              onClick={() => scrollToSection('explore-items')}
              className="w-full sm:w-auto rounded-2xl border-2 border-white/30 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              Explore Items
            </button>
          </div>

          <p className="mt-10 text-sm font-semibold text-sky-200/90">
            Start borrowing smarter today.
          </p>
        </div>
      </section>

      {/* 9. FOOTER */}
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
                CampusLend helps students share resources, save money, reduce waste, and build stronger campus communities.
              </p>
            </div>

            {/* Links column */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-bold text-slate-600">
              <button onClick={() => scrollToSection('top')} className="hover:text-sky-600 transition">
                Home
              </button>
              <button onClick={() => scrollToSection('explore-items')} className="hover:text-sky-600 transition">
                Explore
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
            <p className="mt-2 sm:mt-0">Made with care for student communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
