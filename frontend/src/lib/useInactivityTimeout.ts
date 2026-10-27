/**
 * useInactivityTimeout
 *
 * Tracks user activity (mouse, keyboard, touch, scroll).
 * After `idleMs` of silence, calls `onWarn` to show a warning.
 * After an additional `warnMs` of continued silence, calls `onTimeout` to log out.
 *
 * The last-active timestamp is stored in localStorage so it survives
 * page refreshes and browser restores (shared-computer protection).
 *
 * Usage:
 *   useInactivityTimeout({
 *     idleMs: 30 * 60 * 1000,   // 30 min
 *     warnMs: 2 * 60 * 1000,    // 2 min warning
 *     onWarn: () => setShowWarning(true),
 *     onTimeout: handleLogout,
 *     active: !!session,         // only run when user is logged in
 *   });
 */

import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'cl_last_active';

interface Options {
  /** ms of inactivity before showing the warning (default 30 min) */
  idleMs?: number;
  /** ms of inactivity after warning before forcing logout (default 2 min) */
  warnMs?: number;
  /** called when idleMs elapsed — show your countdown modal here */
  onWarn: () => void;
  /** called when idleMs + warnMs elapsed — perform logout here */
  onTimeout: () => void;
  /** hook only runs when active is true (i.e. user is logged in) */
  active: boolean;
}

export function useInactivityTimeout({
  idleMs = 30 * 60 * 1000,
  warnMs = 2 * 60 * 1000,
  onWarn,
  onTimeout,
  active,
}: Options): void {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnFiredRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    idleTimerRef.current = null;
    warnTimerRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    warnFiredRef.current = false;

    idleTimerRef.current = setTimeout(() => {
      warnFiredRef.current = true;
      onWarn();
      warnTimerRef.current = setTimeout(() => {
        onTimeout();
      }, warnMs);
    }, idleMs);
  }, [clearTimers, idleMs, warnMs, onWarn, onTimeout]);

  const resetActivity = useCallback(() => {
    if (!active) return;
    // If warning is already showing, don't reset (user must explicitly "Stay logged in")
    if (warnFiredRef.current) return;
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    startTimers();
  }, [active, startTimers]);

  useEffect(() => {
    if (!active) {
      clearTimers();
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // On mount: check if the stored last-active is already past the idle threshold
    // (handles: browser restored after long absence, shared computer opened again)
    const stored = localStorage.getItem(STORAGE_KEY);
    const lastActive = stored ? parseInt(stored, 10) : Date.now();
    const elapsed = Date.now() - lastActive;

    if (elapsed >= idleMs + warnMs) {
      // Already timed out while we were away → force logout immediately
      onTimeout();
      return;
    } else if (elapsed >= idleMs) {
      // Past idle threshold but still within warn window → show warning, start countdown for remaining time
      const remaining = idleMs + warnMs - elapsed;
      warnFiredRef.current = true;
      onWarn();
      warnTimerRef.current = setTimeout(onTimeout, remaining);
      return;
    }

    // Normal case: start fresh timers from remaining idle time
    const remaining = idleMs - elapsed;
    clearTimers();
    warnFiredRef.current = false;
    idleTimerRef.current = setTimeout(() => {
      warnFiredRef.current = true;
      onWarn();
      warnTimerRef.current = setTimeout(onTimeout, warnMs);
    }, remaining);

    // Activity event listeners
    const events: (keyof WindowEventMap)[] = [
      'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
    ];
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetActivity));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Keep resetActivity stable via a ref trick so the event listeners don't need to re-register
  const resetRef = useRef(resetActivity);
  useEffect(() => {
    resetRef.current = resetActivity;
  }, [resetActivity]);
}

/** Call this when the user explicitly clicks "Stay logged in" in the warning modal */
export function resetInactivityTimestamp(): void {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}
