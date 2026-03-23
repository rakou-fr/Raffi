export function StatusBar({ state }) {
    const cfg = {
      idle:     { dot: 'bg-white/20',                                label: 'Inactif' },
      starting: { dot: 'bg-yellow-400 animate-pulse',               label: 'Démarrage…' },
      ready:    { dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',   label: 'Prêt' },
      error:    { dot: 'bg-red-500',                                 label: 'Erreur' },
      stopping: { dot: 'bg-yellow-400 animate-pulse',               label: 'Arrêt…' },
    }
    const { dot, label } = cfg[state] || cfg.idle
    return (
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span>{label}</span>
      </div>
    )
  }