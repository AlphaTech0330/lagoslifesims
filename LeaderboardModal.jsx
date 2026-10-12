import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  X, 
  Coins, 
  Truck, 
  ShieldAlert, 
  Medal, 
  MapPin, 
  Loader2 
} from 'lucide-react';
import { useAuth } from './AuthContext';

export default function LeaderboardModal({ isOpen, onClose }) {
  const { fetchWithAuth, player: currentPlayer } = useAuth();
  const [activeCategory, setActiveCategory] = useState('networth'); // networth | haulage | factions
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await fetchWithAuth(`/factions/leaderboards?category=${activeCategory}&limit=10`);
        if (data.success) {
          setLeaderboardData(data.leaderboard);
        }
      } catch (error) {
        console.error('Failed to load leaderboards:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [isOpen, activeCategory]);

  if (!isOpen) return null;

  const categories = [
    { id: 'networth', label: 'Net Worth', icon: Coins },
    { id: 'haulage', label: 'Cargo Volume', icon: Truck },
    { id: 'factions', label: 'Union Power', icon: ShieldAlert },
  ];

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-xs font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Southwestern Rankings</h2>
              <p className="text-xs text-slate-400">Top hustlers and unions across Southwestern Nigeria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 p-2 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm">Fetching regional rankings...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((item, index) => {
                const rank = index + 1;
                const isSelf = currentPlayer && item._id === currentPlayer.id;

                return (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelf
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md'
                        : rank <= 3
                        ? 'bg-slate-800/40 border-slate-700/60'
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    {/* Left Rank & Identity */}
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center items-center">
                        {getRankBadge(rank)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {activeCategory === 'factions' ? item.name : item.username}
                          </span>
                          {item.faction && activeCategory !== 'factions' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                              [{item.faction.tag}]
                            </span>
                          )}
                          {activeCategory === 'factions' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              [{item.tag}]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{activeCategory === 'factions' ? item.headquartersState : item.currentLocation}</span>
                          {activeCategory !== 'factions' && (
                            <span className="text-slate-600">• {item.totalTradesCompleted || 0} trades</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Numeric Values */}
                    <div className="text-right">
                      {activeCategory === 'networth' && (
                        <div>
                          <div className="text-sm font-extrabold text-emerald-400">
                            ₦{(item.netWorth || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">Total Net Worth</div>
                        </div>
                      )}

                      {activeCategory === 'haulage' && (
                        <div>
                          <div className="text-sm font-extrabold text-blue-400">
                            {(item.totalCargoHauledKg || 0).toLocaleString()} kg
                          </div>
                          <div className="text-[10px] text-slate-500">Cargo Hauled</div>
                        </div>
                      )}

                      {activeCategory === 'factions' && (
                        <div>
                          <div className="text-sm font-extrabold text-amber-400">
                            ₦{(item.treasuryBalance || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">Union Treasury</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}