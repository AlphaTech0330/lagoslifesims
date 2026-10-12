import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Trophy, Landmark, PlusCircle, ArrowUpRight, 
  ShieldCheck, AlertCircle, CheckCircle, Wallet, Crown 
} from 'lucide-react';

const STATES = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

export default function FactionLeaderboard({ player, onPlayerUpdate }) {
  const [activeTab, setActiveTab] = useState('LEADERBOARD'); // 'LEADERBOARD' or 'MY_UNION'
  const [leaderboardType, setLeaderboardType] = useState('networth'); // 'networth' or 'factions'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Union Creation Form State
  const [unionName, setUnionName] = useState('');
  const [unionTag, setUnionTag] = useState('');
  const [description, setDescription] = useState('');
  const [headquartersState, setHeadquartersState] = useState('Lagos');

  // Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/factions/leaderboards?category=${leaderboardType}&limit=10`);
      setLeaderboardData(res.data.leaderboard);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnion = async (e) => {
    e.preventDefault();
    if (!unionName || !unionTag) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await api.post('/factions/create', {
        name: unionName,
        tag: unionTag.toUpperCase(),
        description,
        headquartersState
      });

      setStatusMessage({ type: 'success', text: `Union [${res.data.faction.tag}] created successfully!` });
      if (onPlayerUpdate) {
        onPlayerUpdate({ faction: res.data.faction._id, factionRole: 'Leader' });
      }
      fetchLeaderboard();
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create union' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseInt(depositAmount, 10);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await api.post('/factions/treasury/deposit', { amount });
      setStatusMessage({ type: 'success', text: `Deposited ₦${amount.toLocaleString()} to Union Treasury!` });
      setDepositAmount('');

      if (onPlayerUpdate) {
        onPlayerUpdate({ cash: res.data.remainingCash });
      }
      fetchLeaderboard();
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Deposit failed' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-hustle-green" />
            Transport Unions & Leaderboards
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Form regional transport unions, build up central treasuries, and dominate the Southwestern net worth rankings.
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'LEADERBOARD'
                ? 'bg-hustle-green text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Regional Rankings
          </button>
          <button
            onClick={() => setActiveTab('MY_UNION')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'MY_UNION'
                ? 'bg-hustle-green text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" /> My Union
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm border ${
          statusMessage.type === 'success' 
            ? 'bg-green-950/40 border-hustle-green/50 text-green-300' 
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-hustle-green shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: REGIONAL LEADERBOARDS */}
      {activeTab === 'LEADERBOARD' && (
        <div>
          {/* Category Toggle Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setLeaderboardType('networth')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                leaderboardType === 'networth'
                  ? 'bg-hustle-gold/10 border-hustle-gold text-hustle-gold'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Top Individual Traders
            </button>
            <button
              onClick={() => setLeaderboardType('factions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                leaderboardType === 'factions'
                  ? 'bg-hustle-gold/10 border-hustle-gold text-hustle-gold'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Top Union Treasuries
            </button>
          </div>

          {/* Leaderboard Table */}
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-mono text-sm animate-pulse">
              Fetching rankings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-800 uppercase text-xs text-gray-400">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">{leaderboardType === 'networth' ? 'Trader' : 'Union Name'}</th>
                    <th className="p-3">{leaderboardType === 'networth' ? 'Location' : 'Headquarters'}</th>
                    <th className="p-3 text-right">
                      {leaderboardType === 'networth' ? 'Net Worth' : 'Treasury Balance'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboardData.map((entry, index) => (
                    <tr key={entry._id} className="hover:bg-gray-800/50 transition">
                      <td className="p-3 font-mono font-bold">
                        {index === 0 ? (
                          <span className="text-hustle-gold flex items-center gap-1">
                            <Crown className="w-4 h-4" /> #1
                          </span>
                        ) : (
                          `#${index + 1}`
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">
                          {entry.username || entry.name}
                          {entry.tag && (
                            <span className="ml-2 text-xs font-mono text-hustle-gold bg-hustle-gold/10 px-2 py-0.5 rounded">
                              [{entry.tag}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {entry.currentLocation || entry.headquartersState}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-hustle-gold">
                        ₦{(entry.netWorth || entry.treasuryBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY UNION & TREASURY MANAGEMENT */}
      {activeTab === 'MY_UNION' && (
        <div>
          {player?.faction ? (
            /* Treasury Deposit Card */
            <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Landmark className="text-hustle-green" />
                Deposit to Union Treasury
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Contribute cash to your transport union's central treasury to fund regional operational expansion and boost your union's rank.
              </p>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                    Deposit Amount (₦)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1000"
                      max={player?.cash || 0}
                      placeholder="e.g. 100000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono font-bold focus:outline-none focus:border-hustle-green"
                    />
                    <button
                      type="button"
                      onClick={() => setDepositAmount(player?.cash || 0)}
                      className="absolute right-2 top-2 bg-gray-700 text-xs px-3 py-1.5 rounded text-gray-300 hover:text-white font-semibold"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center text-xs">
                  <span className="text-gray-400">Your Wallet Cash:</span>
                  <span className="font-mono font-bold text-hustle-gold">
                    ₦{player?.cash?.toLocaleString() || '0'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !depositAmount}
                  className="w-full py-3 rounded-lg bg-hustle-green hover:bg-green-700 text-white font-bold text-sm transition"
                >
                  {isSubmitting ? 'Processing Deposit...' : 'Confirm Treasury Deposit'}
                </button>
              </form>
            </div>
          ) : (
            /* Create New Union Form */
            <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <PlusCircle className="text-hustle-gold" />
                Register a Transport Union
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                You do not belong to a transport union. Register a new union to rally local traders and build a regional empire.
              </p>

              <form onSubmit={handleCreateUnion} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                      Union Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lagos Express Guild"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                      Tag (3-4 Chars)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="LEG"
                      value={unionTag}
                      onChange={(e) => setUnionTag(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white uppercase font-mono font-bold focus:outline-none focus:border-hustle-green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                    Headquarters State
                  </label>
                  <select
                    value={headquartersState}
                    onChange={(e) => setHeadquartersState(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
                  >
                    {STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                    Description / Manifesto
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your union's focus across Southwestern routes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-hustle-green hover:bg-green-700 text-white font-bold text-sm transition"
                >
                  {isSubmitting ? 'Registering Union...' : 'Form Transport Union'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}