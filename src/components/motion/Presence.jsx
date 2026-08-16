import { useRef, useState, useLayoutEffect } from 'react';
import { gsap, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';

/**
 * Mount/unmount with an exit animation — the piece `AnimatePresence` used to
 * provide. Children stay mounted until the exit tween finishes.
 */
export default function Presence({
  show,
  from = { opacity: 0 },
  to = { opacity: 1 },
  exit = { opacity: 0 },
  duration = DUR.base,
  ease = EASE.out,
  className,
  children,
  ...rest
}) {
  const [mounted, setMounted] = useState(show);
  const ref = useRef(null);
  const tween = useRef(null);

  // Bring the node back before we try to animate it in.
  useLayoutEffect(() => {
    if (show) setMounted(true);
  }, [show]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!mounted || !el) return;

    tween.current?.kill();

    if (prefersReducedMotion()) {
      if (show) gsap.set(el, { ...to, clearProps: 'transform' });
      else setMounted(false);
      return;
    }

    if (show) {
      tween.current = gsap.fromTo(
        el,
        from,
        { ...to, duration, ease, overwrite: 'auto' }
      );
    } else {
      tween.current = gsap.to(el, {
        ...exit,
        duration: duration * 0.65,
        ease: EASE.in,
        overwrite: 'auto',
        onComplete: () => setMounted(false),
      });
    }

    return () => tween.current?.kill();
    // `from`/`to`/`exit` are literals from the caller; re-running on identity
    // changes would restart the tween on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, mounted]);

  if (!mounted) return null;

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
