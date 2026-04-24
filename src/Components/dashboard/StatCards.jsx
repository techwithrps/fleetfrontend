import React, { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  Truck,
  DollarSign,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import api from "../../utils/Api";
import { Link } from "react-router-dom"; // <-- Import Link

const StatsCards = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    inProgressRequests: 0,
    totalSpent: 0,
    averagePrice: 0,
    thisMonthRequests: 0,
    rejectedRequests: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/transport-requests/my-requests");
      if (response.data?.success) {
        calculateStats(response.data.requests || []);
      }
    } catch (err) {
      setError(err.message || "Sync failure");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    setStats({
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status?.toLowerCase() === "pending").length,
      completedRequests: requests.filter(r => r.status?.toLowerCase() === "completed").length,
      inProgressRequests: requests.filter(r => ["in progress", "approved"].includes(r.status?.toLowerCase())).length,
      rejectedRequests: requests.filter(r => r.status?.toLowerCase() === "rejected").length,
      thisMonthRequests: requests.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length,
    });
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: "Logistics Flow",
      label: "Total Requests",
      value: stats.totalRequests,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/10",
      change: stats.thisMonthRequests > 0 ? `+${stats.thisMonthRequests} Monthly Volume` : "Steady-state operation",
      route: "/customer/my-shipments",
    },
    {
      title: "Strategic Pending",
      label: "Awaiting Action",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50/50",
      border: "border-indigo-100",
      change: `${((stats.pendingRequests / (stats.totalRequests || 1)) * 100).toFixed(1)}% Queue Density`,
      route: "/customer/my-shipments?status=pending",
    },
    {
      title: "Mission Success",
      label: "Completed",
      value: stats.completedRequests,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      change: `${((stats.completedRequests / (stats.totalRequests || 1)) * 100).toFixed(1)}% Deployment Rate`,
      route: "/customer/my-shipments?status=completed",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-premium p-6 animate-pulse bg-white/50 border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 rounded w-16"></div>
                <div className="h-6 bg-slate-200 rounded w-24"></div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
            </div>
            <div className="h-2 bg-slate-100 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-premium p-4 mb-8 bg-rose-50 border-rose-100 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-500" />
        <span className="text-[11px] font-bold text-rose-800 uppercase tracking-widest">Network Synchronization Error</span>
        <button onClick={fetchStats} className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter hover:underline">Re-establish Sync</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statCards.map((card, i) => (
        <Link
          to={card.route}
          key={i}
          className={`card-premium p-6 bg-white group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 border-b-4 ${card.color === 'text-primary' ? 'border-b-primary' : card.color === 'text-indigo-600' ? 'border-b-indigo-500' : 'border-b-emerald-500'}`}
          style={{ textDecoration: "none" }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-display font-bold text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${card.bg} ${card.border} border group-hover:rotate-12 transition-transform duration-500`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${card.bg} ${card.color}`}>
              {card.change}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default StatsCards;
