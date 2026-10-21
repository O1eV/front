export function Sparkline({ down = false, seed = 0 }: { down?: boolean; seed?: number }) {
  const points = Array.from(
    { length: 30 },
    (_, pointIndex) =>
      `${pointIndex * 3.4},${30 - Math.sin(pointIndex * 1.6 + seed) * 5 - (down ? -1 : 1) * pointIndex * 0.65}`
  ).join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 55" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={down ? "var(--negative)" : "var(--positive)"}
        strokeWidth="1.8"
      />
    </svg>
  );
}
