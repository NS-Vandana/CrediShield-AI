/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  CreditCard, 
  TrendingUp, 
  User, 
  Clock, 
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { riskEngine } from '../services/risk-engine';
import { Transaction, UserRiskProfile, RealTimeAggregates } from '../types/risk';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function RiskDashboard() {
  const [isReady, setIsReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserRiskProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRiskProfile | null>(null);
  const [aggregates, setAggregates] = useState<RealTimeAggregates | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'feature-store' | 'simulator'>('monitor');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time animation
  const lastIdRef = useRef(50);

  useEffect(() => {
    const init = async () => {
      await riskEngine.initialize();
      const allUsers = riskEngine.getAllUsers();
      setUsers(allUsers);
      if (allUsers.length > 0) setSelectedUser(allUsers[0]);
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const agg = riskEngine.calculateRealTimeAggregates(selectedUser.user_id);
      setAggregates(agg);
      handleExplain(selectedUser.user_id);
    }
  }, [selectedUser]);

  const handleExplain = async (userId: string) => {
    setIsExplaining(true);
    const text = await riskEngine.getAiDecisionExplanation(userId, 500);
    setAiExplanation(text);
    setIsExplaining(false);
  };

  const simulateNewTransaction = () => {
    if (!users.length) return;
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const newTxn: Transaction = {
      transaction_id: `TXN${Math.random().toString().slice(2, 10)}`,
      user_id: randomUser.user_id,
      timestamp: new Date().toISOString(),
      amount: Math.floor(Math.random() * 5000),
      category: ['Grocery', 'Electronics', 'Travel', 'Fashion', 'Healthcare'][Math.floor(Math.random() * 5)],
      transaction_status: Math.random() > 0.05 ? 'Success' : 'Failed',
      payment_method: 'UPI',
      merchant_id: `MER${Math.floor(Math.random() * 9999)}`,
      pay_later_requested: Math.random() > 0.7,
      device_type: 'Mobile'
    };
    setTransactions(prev => [newTxn, ...prev].slice(0, 10));
    
    // If it's the selected user, update her aggregates
    if (newTxn.user_id === selectedUser?.user_id) {
       setAggregates(riskEngine.calculateRealTimeAggregates(newTxn.user_id));
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(simulateNewTransaction, 3000);
    return () => clearInterval(interval);
  }, [isReady, selectedUser]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Initializing Risk Engine Feature Store...</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => u.user_id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-800/50 bg-slate-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div id="brand-container" className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CrediShield <span className="text-emerald-500">AI</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Risk & Credit Cluster
              </p>
            </div>
          </div>

          <nav id="main-nav" className="flex bg-slate-800/50 p-1 rounded-xl">
             <button 
               id="tab-monitor"
               onClick={() => setActiveTab('monitor')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'monitor' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
             >
               Live Monitor
             </button>
             <button 
               id="tab-feature-store"
               onClick={() => setActiveTab('feature-store')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'feature-store' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
             >
               Feature Store
             </button>
             <button 
               id="tab-simulator"
               onClick={() => setActiveTab('simulator')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'simulator' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
             >
               Simulator
             </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        
        {/* KPI Row */}
        <div id="kpi-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard id="stat-throughput" title="System Throughput" value="1.2k req/s" sub="+5.2%" icon={Activity} color="text-emerald-500" />
          <StatCard id="stat-latency" title="Decision Latency" value="18ms" sub="-2ms" icon={Clock} color="text-sky-500" />
          <StatCard id="stat-risk" title="Avg Risk Score" value="742" sub="Optimal" icon={TrendingUp} color="text-amber-500" />
          <StatCard id="stat-default" title="Default Rate" value="0.84%" sub="-0.1%" icon={ShieldAlert} color="text-rose-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Live Stream */}
          <div className="lg:col-span-4 space-y-6">
            <div id="live-feed" className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-500" />
                   Ingestion Stream
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-mono uppercase">Live</span>
              </div>
              <div className="h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                  {transactions.map((txn, idx) => (
                    <motion.div 
                      key={txn.transaction_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${txn.transaction_status === 'Failed' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">₹{txn.amount}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{txn.user_id} • {txn.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${txn.transaction_status === 'Failed' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {txn.transaction_status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl">
               <h3 className="font-semibold mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-sky-500" />
                 Risk Score Distribution
               </h3>
               <div className="h-[150px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { range: '0-300', count: 12 },
                      { range: '300-600', count: 45 },
                      { range: '600-800', count: 120 },
                      { range: '800-1000', count: 88 },
                    ]}>
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {users.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={index > 2 ? '#10b981' : index > 1 ? '#34d399' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Right Column: Deep Analysis */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* User Selector */}
            <div id="user-search-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6">
              <div className="relative group flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  id="user-search-input"
                  type="text" 
                  placeholder="Search user ID (e.g. USR00001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:border-emerald-500 outline-none"
                />
                
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto">
                    {filteredUsers.map(u => (
                      <button 
                        key={u.user_id}
                        onClick={() => {
                          setSelectedUser(u);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-between"
                      >
                        <span className="font-mono text-sm">{u.user_id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${u.risk_profile === 'low' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {u.risk_profile}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-px bg-slate-800 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <User className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-none">{selectedUser?.user_id}</h4>
                    <p className="text-xs text-slate-500 mt-1 capitalize">{selectedUser?.city} • {selectedUser?.monthly_income} INR/mo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Feature Store Aggregates */}
              <div id="analysis-feature-store" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Real-Time Feature Store</h3>
                <div className="space-y-6">
                  <AggregateRow id="agg-spend" label="Avg Spend (30d)" value={`₹${aggregates?.avg_spend_l30d}`} icon={TrendingUp} />
                  <AggregateRow id="agg-failures" label="Failed Payments" value={aggregates?.failed_count_l30d || 0} icon={XCircle} color="text-rose-500" />
                  <AggregateRow id="agg-velocity" label="Txn Velocity (24h)" value={aggregates?.velocity_l24h || 0} icon={Activity} />
                  <AggregateRow id="agg-top-cat" label="Dominant Category" value={aggregates?.top_category} icon={ArrowRight} color="text-sky-500" />
                  
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium text-slate-300">Live Risk Score</span>
                       <span className={`text-lg font-bold ${aggregates?.current_risk_score && aggregates.current_risk_score > 700 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {aggregates?.current_risk_score}/1000
                       </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(aggregates?.current_risk_score || 0) / 10}%` }}
                         className={`h-full ${aggregates?.current_risk_score && aggregates.current_risk_score > 700 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Agent Decision */}
              <div id="ai-agent-container" className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-white">AI Decision Agent</h3>
                </div>
                
                <div id="ai-explanation-text" className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800 italic text-sm text-slate-300 leading-relaxed shadow-inner font-mono">
                  {isExplaining ? (
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-3/4 bg-slate-800 animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-slate-800 animate-pulse rounded" />
                    </div>
                  ) : (
                    `"${aiExplanation}"`
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                   <div className={`flex-1 p-3 rounded-xl border flex items-center justify-between ${aggregates?.current_risk_score && aggregates.current_risk_score > 500 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                     <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Credit Recommendation</p>
                       <p className={`font-bold ${aggregates?.current_risk_score && aggregates.current_risk_score > 500 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {aggregates?.current_risk_score && aggregates.current_risk_score > 600 ? 'PROCEED ✅' : aggregates?.current_risk_score && aggregates.current_risk_score > 400 ? 'REFER 📨' : 'REJECT ❌'}
                       </p>
                     </div>
                     {aggregates?.current_risk_score && aggregates.current_risk_score > 500 ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                   </div>
                </div>
              </div>
            </div>

            {/* Spend Pattern Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Historical Spend Pattern
                </h3>
                <div className="flex gap-2">
                  <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Spend</span>
                  <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Average</span>
                </div>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={[
                     { name: 'W1', value: 1200 },
                     { name: 'W2', value: 3400 },
                     { name: 'W3', value: 2100 },
                     { name: 'W4', value: 4500 },
                     { name: 'W5', value: 3800 },
                     { name: 'W6', value: 5200 },
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                       itemStyle={{ color: '#10b981' }}
                     />
                     <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                   </LineChart>
                 </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-8 border-t border-slate-800 text-center text-slate-500 text-xs">
        <p>© 2026 CrediShield Retail Risk Engine. Certified PCI-DSS Compliance Simulation.</p>
      </footer>
    </div>
  );
}

function StatCard({ id, title, value, sub, icon: Icon, color }: any) {
  return (
    <div id={id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-500 font-medium">{title}</p>
          <span className={`text-[10px] font-bold ${sub.startsWith('+') ? 'text-emerald-500' : sub.startsWith('-') ? 'text-emerald-500' : 'text-sky-500'}`}>
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

function AggregateRow({ id, label, value, icon: Icon, color = "text-emerald-500" }: any) {
  return (
    <div id={id} className="flex items-center justify-between py-1 hover:translate-x-1 transition-transform cursor-pointer">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-mono text-white font-bold">{value}</span>
    </div>
  )
}
