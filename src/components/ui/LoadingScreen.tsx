export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-ivory-100 flex items-center justify-center z-50" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-card animate-pulse-soft">
          <span className="text-white font-display font-bold text-xl">S</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-navy-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-navy-400 text-sm font-medium">Loading Shoora EB-5…</p>
      </div>
    </div>
  )
}
