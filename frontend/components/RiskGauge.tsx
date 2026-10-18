"use client";
import { useEffect, useRef } from "react";

interface RiskGaugeProps {
  score: number;
  level: string;
}

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const W = 220;
  const H = 130;        // fixed, generous height — nothing overlaps
  const cx = W / 2;
  const cy = 105;       // arc centre pushed near bottom so the arc has room above
  const r  = 80;
  const strokeW = 14;

  const color =
    score >= 70 ? "#ef4444" : score >= 40 ? "#eab308" : "#22c55e";
  const bgColor =
    score >= 70 ? "#ef44441a" : score >= 40 ? "#eab3081a" : "#22c55e1a";
  const levelLabel =
    score >= 70 ? "CRITICAL" : score >= 40 ? "MEDIUM" : "SAFE";

  // 180° semicircle: -180° (left) → 0° (right)
  const startAngle = -180;
  const scoreAngle = startAngle + (score / 100) * 180;
  const scoreRad   = (scoreAngle * Math.PI) / 180;

  function polar(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(a1: number, a2: number) {
    const s = polar(a1);
    const e = polar(a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const tip = polar(scoreAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Background track */}
        <path
          d={arc(-180, 0)}
          fill="none"
          stroke="var(--border-main)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Coloured filled arc */}
        {score > 0 && (
          <path
            d={arc(-180, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color}99)`,
              transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
        )}

        {/* Tip glow dot */}
        <circle
          cx={tip.x}
          cy={tip.y}
          r={7}
          fill={color}
          style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: "all 0.9s ease" }}
        />

        {/* Score number — sits well above the bottom edge */}
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          fill="var(--text-main)"
          style={{ fontSize: 32, fontWeight: 700, fontFamily: "sans-serif" }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "sans-serif" }}
        >
          / 100
        </text>

        {/* Axis labels */}
        <text x={cx - r + 4} y={cy + 14} textAnchor="middle"
          style={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "sans-serif" }}>0</text>
        <text x={cx + r - 4} y={cy + 14} textAnchor="middle"
          style={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "sans-serif" }}>100</text>
      </svg>

      {/* Level pill — sits below the SVG, no overlap */}
      <div
        className="mt-1 px-4 py-1 rounded-full text-[11px] font-bold tracking-widest"
        style={{ background: bgColor, color, border: `1px solid ${color}55` }}
      >
        {levelLabel}
      </div>
    </div>
  );
}
