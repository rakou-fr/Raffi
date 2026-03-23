export function Spinner({ size = 14 }) {
    return (
      <span
        style={{ width: size, height: size }}
        className="inline-block rounded-full border-2 border-white/15 border-t-white animate-spin flex-shrink-0"
      />
    )
  }