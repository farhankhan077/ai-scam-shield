"use client";
import { Bell, ShieldAlert, CheckCircle2, Info } from "lucide-react";

export default function NotificationsView() {
  const notifications = [
    {
      id: 1,
      type: "critical",
      title: "New Fraud Pattern Detected",
      message: "AI has identified a surge in high-velocity transfers originating from IP block 192.168.x.x matching Pattern 7 (BEC).",
      time: "2 mins ago",
      icon: ShieldAlert,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
    {
      id: 2,
      type: "success",
      title: "Model Retraining Completed",
      message: "Gemini embedding weights have been successfully updated with the latest scam case studies.",
      time: "1 hour ago",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      id: 3,
      type: "info",
      title: "FedNow Network Update",
      message: "Scheduled maintenance on the FedNow routing stream will occur tonight at 02:00 EST. Expect minor latency.",
      time: "3 hours ago",
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      id: 4,
      type: "critical",
      title: "Threshold Alert: False Positives",
      message: "Safe transaction block rate exceeded 2% in the last hour. Consider tuning the velocity threshold parameter.",
      time: "5 hours ago",
      icon: Bell,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-main">System Notifications</h2>
          <p className="text-sm text-text-muted mt-1">Platform alerts and AI insights</p>
        </div>
        <button className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors">
          Mark all as read
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.id} className="bg-panel border border-border-main p-4 rounded-xl flex items-start gap-4 hover:border-border-main/80 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.bg} ${n.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-text-main">{n.title}</h3>
                  <span className="text-xs font-medium text-text-muted">{n.time}</span>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{n.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
