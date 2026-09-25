/**
 * Barely-there animated background for the public pages: warm gold light that
 * drifts very slowly behind black-and-white content. Pure CSS transforms, no
 * canvas or filters; frozen for users who prefer reduced motion.
 */
export function LiveWallpaper() {
  return (
    <div aria-hidden="true" className="live-wallpaper pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="lw-glow lw-glow-1" />
      <div className="lw-glow lw-glow-2" />
      <div className="lw-glow lw-glow-3" />
      <div className="lw-grain" />
    </div>
  );
}
