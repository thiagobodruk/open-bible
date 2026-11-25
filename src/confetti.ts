/** Two cannons from the bottom corners, as in the celebration of a finished plan. Loaded on demand and skipped when the system asks for less motion. */
export async function celebrate() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const { default: confetti } = await import('canvas-confetti');
    const base = { particleCount: 70, spread: 70, startVelocity: 55, ticks: 220, zIndex: 100, disableForReducedMotion: true };
    confetti({ ...base, angle: 60, origin: { x: 0, y: 0.85 } });
    confetti({ ...base, angle: 120, origin: { x: 1, y: 0.85 } });
    setTimeout(() => {
      confetti({ ...base, particleCount: 40, angle: 70, origin: { x: 0.1, y: 0.9 } });
      confetti({ ...base, particleCount: 40, angle: 110, origin: { x: 0.9, y: 0.9 } });
    }, 250);
  } catch {
    // Celebration is a bonus; a failed chunk load changes nothing.
  }
}
