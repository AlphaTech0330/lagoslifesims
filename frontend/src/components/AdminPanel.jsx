import React, { useState } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, RefreshCw, DollarSign, TrendingUp, 
  Crown, CheckCircle2, AlertCircle, Sparkles, UserCheck 
} from 'lucide-react';

export default function AdminPanel({ player, onPlayerUpdate }) {
  // Grant Form State
  const [grantUsername, setGrantUsername] = useState('');
  const [grantAmount, setGrantAmount] = useState(500000);

  // Status & UI States
  const [isRotating, setIsRotating] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [message, setMessage] = useState(null);

  // Security Check: Deny rendering if non-admin
  if (!player?.isAdmin) {
    return (
      <div className="bg-hustle-card p-12 rounded-xl border border-red-900/60 text-center space-y-4 max-w-xl mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-xs text-gray-400">
          This panel is restricted exclusively to authorized Administrators. Your account (<span className="text-white font-mono">{player?.username}</span>) lacks administrative clearance.
        </p>
      </div>
    );
  }

  // 1. Force Rotate Regional Elections Cycle
  const handleForceRotateElections = async () => {
    setIsRotating(true);
    setMessage(null);

    try {
      const res = await api.post('/elections/force-rotate');
      setMessage({ type: 'success', text: `✅ ${res.data.message}` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err.response?.data?.message || 'Failed to rotate election cycles.'}`
      });
    } finally {
      setIsRotating(false);
    }
  };

  // 2. Issue Cash Grant to Target Player
  const handleIssueGrant = async (e) => {
    e.preventDefault();
    if (!grantUsername.trim() || grantAmount <= 0) return;

    setIsGranting(true);
    setMessage(null);

    try {
      // Endpoint to grant player funds
      const res = await api.post('/admin/grant-funds', {
        username: grantUsername.trim(),
        amount: parseInt(grantAmount, 10)
      });

      setMessage({ type: 'success', text: `✅ ${res.data.message}` });

      // If granting cash to self, update local state immediately
      if (grantUsername.trim().toLowerCase() === player.username.toLowerCase() && onPlayerUpdate) {
        onPlayerUpdate({ cash: player.cash + parseInt(grantAmount, 10) });
      }

      setGrantUsername('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err.response?.data?.message || 'Failed to issue player grant.'}`
      });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Admin Header */}
      <div className="bg-hustle-card p-6 rounded-xl border border-amber-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="text-hustle-gold w-6 h-6" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Administrator Command Center
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time simulation controls, economic intervention tools, and political election triggers.
          </p>
        </div>

        <div className="bg-amber-950/40 border border-hustle-gold/40 px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
          <UserCheck className="w-4 h-4 text-hustle-gold" />
          <div className="text-xs">
            <span className="text-gray-400 block text-[10px] font-mono">Logged Admin:</span>
            <span className="font-bold text-white">{player.username}</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-green-950/40 border-hustle-green/50 text-green-300'
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Election Rotation Management */}
        <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-800">
              <RefreshCw className="text-hustle-green w-5 h-5" />
              <h3 className="font-bold text-white text-base">Regional Election Rotation</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              Manually shift Union Election phases across all 5 Southwestern corridors (<span className="text-white font-semibold">Lagos, Ibadan, Ogun, Osun, Kwara</span>).
            </p>

            <div className="p-3.5 bg-gray-900 border border-gray-800 rounded-xl space-y-2 text-[11px] text-gray-400 font-mono mb-4">
              <div>• Phase 1: Shift REGISTRATION ➔ VOTING</div>
              <div>• Phase 2: Shift VOTING ➔ CLOSED (Tally votes & declare Chairman)</div>
              <div>• Phase 3: Seed new REGISTRATION cycle for next week</div>
            </div>
          </div>

          <button
            disabled={isRotating}
            onClick={handleForceRotateElections}
            className="w-full py-3 px-4 rounded-xl bg-hustle-green hover:bg-green-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            <span>{isRotating ? 'Rotating Cycles...' : 'Force Rotate Election Phase'}</span>
          </button>
        </div>

        {/* 2. Issue Direct Player Grant */}
        <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-800">
            <Sparkles className="text-hustle-gold w-5 h-5" />
            <h3 className="font-bold text-white text-base">Issue Treasury Grant</h3>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Inject liquidity or issue tournament rewards directly into a target trader's cash wallet.
          </p>

          <form onSubmit={handleIssueGrant} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Target Username</label>
              <input
                type="text"
                required
                value={grantUsername}
                onChange={(e) => setGrantUsername(e.target.value)}
                placeholder="e.g. AlphaTech0330"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hustle-gold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Amount (₦)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-hustle-gold"
              />
            </div>

            <button
              type="submit"
              disabled={isGranting}
              className="w-full py-3 px-4 rounded-xl bg-hustle-gold hover:bg-amber-600 text-black font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4" />
              <span>{isGranting ? 'Processing Transfer...' : 'Issue Treasury Grant'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}