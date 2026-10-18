"use client";
import { Transaction } from "@/lib/api";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { ShieldAlert, Zap, ShieldCheck, TrendingUp } from "lucide-react";

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export default function AnalyticsView({ transactions }: AnalyticsViewProps) {
  // Aggregate data for risk distribution
  const riskData = useMemo(() => {
    let safe = 0,
      medium = 0,
      critical = 0;
    transactions.forEach((tx) => {
      if (tx.risk_level === "Safe") safe++;
      else if (tx.risk_level === "Medium") medium++;
      else critical++;
    });
    return [
      { name: "Safe", value: safe, color: "#22c55e" },
      { name: "Medium", value: medium, color: "#eab308" },
      { name: "Critical", value: critical, color: "#ef4444" },
    ];
  }, [transactions]);

  // Aggregate data for risk score timeline
  const timelineData = useMemo(() => {
    return [...transactions].reverse().map((tx, i) => ({
      index: i + 1,
      id: tx.transaction_id.slice(0, 6),
      score: tx.risk_score,
      amount: tx.amount,
      level: tx.risk_level,
    }));
  }, [transactions]);

  // Scatter plot data (Amount vs Risk Score)
  const scatterData = useMemo(() => {
    return transactions.map((tx) => ({
      amount: tx.amount,
      score: tx.risk_score,
      level: tx.risk_level,
      id: tx.transaction_id.slice(0, 6),
      fill: tx.risk_level === "Critical" ? "#ef4444" : tx.risk_level === "Medium" ? "#eab308" : "#22c55e",
    }));
  }, [transactions]);

  // Bar chart data (Volume by Channel)
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      const ch = tx.channel || "Unknown";
      counts[ch] = (counts[ch] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      volume: count,
    }));
  }, [transactions]);

  const avgScore = transactions.length 
    ? Math.round(transactions.reduce((acc, tx) => acc + tx.risk_score, 0) / transactions.length) 
    : 0;
    
  const criticalVolume = transactions.filter(t => t.risk_level === "Critical").reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="flex flex-col h-full bg-background p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main">Live Analytics Dashboard</h2>
        <p className="text-sm text-text-muted mt-1">Real-time fraud insights, volumes, and correlations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-panel border border-border-main p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Processed Txns</p>
            <p className="text-xl font-bold text-text-main">{transactions.length}</p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Avg Risk Score</p>
            <p className="text-xl font-bold text-text-main">{avgScore}/100</p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Safe Ratio</p>
            <p className="text-xl font-bold text-text-main">
              {transactions.length ? Math.round((riskData[0].value / transactions.length) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-panel border border-border-main p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Critical Volume</p>
            <p className="text-xl font-bold text-text-main">${criticalVolume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Area Chart: Risk Score Timeline */}
        <div className="col-span-2 bg-panel border border-border-main p-5 rounded-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-main">Risk Score Timeline</h3>
            <p className="text-xs text-text-muted mt-0.5">Risk progression for the last 100 transactions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis 
                  dataKey="index" 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `Tx #${val}`} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 8, color: 'var(--text-main)', fontSize: 12 }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  labelFormatter={(val) => `Transaction #${val}`}
                />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={40} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Medium', fill: '#eab308', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Risk Score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  activeDot={{ r: 6, fill: "#8b5cf6", stroke: "var(--background)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Risk Distribution */}
        <div className="col-span-1 bg-panel border border-border-main p-5 rounded-xl flex flex-col items-center">
          <div className="self-start mb-2">
            <h3 className="text-sm font-bold text-text-main">Risk Distribution</h3>
            <p className="text-xs text-text-muted mt-0.5">Breakdown by threat level</p>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 8, color: 'var(--text-main)', fontSize: 12 }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 w-full mt-4">
            {riskData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-text-muted">{d.name}</span>
                </div>
                <span className="text-text-main">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Scatter Chart: Amount vs Risk */}
        <div className="bg-panel border border-border-main p-5 rounded-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-main">Amount vs. Risk Score</h3>
            <p className="text-xs text-text-muted mt-0.5">Identifying high-value risk clusters</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis 
                  type="number" 
                  dataKey="amount" 
                  name="Amount" 
                  unit="$" 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  type="number" 
                  dataKey="score" 
                  name="Risk Score" 
                  domain={[0, 100]} 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <ZAxis type="category" dataKey="level" name="Risk Level" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 8, color: 'var(--text-main)', fontSize: 12 }}
                />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Channel Volume */}
        <div className="bg-panel border border-border-main p-5 rounded-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-main">Transaction Volume by Channel</h3>
            <p className="text-xs text-text-muted mt-0.5">Network utilization</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  cursor={{ fill: 'var(--panel-hover)' }}
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-main)', borderRadius: 8, color: 'var(--text-main)', fontSize: 12 }}
                />
                <Bar dataKey="volume" name="Transactions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
