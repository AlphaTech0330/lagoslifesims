import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from './services/api';
import Auth from './components/Auth';
import PropertyManager from './components/PropertyManager';
import FactionLeaderboard from './components/FactionLeaderboard';
import CargoInspector from './components/CargoInspector';
import SoundEngine from './components/SoundEngine';
import CheckpointModal from './components/CheckpointModal';
import TravelEventModal from './components/TravelEventModal';
import UnionElection from './components/UnionElection';
import TraderChat from './components/TraderChat';
import AdminPanel from './components/AdminPanel';
import { 
  MapPin, Wallet, Zap, Truck, TrendingUp, 
  ShoppingCart, DollarSign, X, Building2, Users, 
  PackageCheck, LogOut, Vote, MessageSquare, Crown 
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3030';
const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

export default function App() {
  const [activeTab, setActiveTab] = useState('MARKET'); // 'MARKET', 'REAL_ESTATE', 'ELECTIONS', 'FACTIONS', 'CARGO', 'CHAT', 'ADMIN'
  const [player, setPlayer] = useState(null);
  const [market, setMarket] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Interception Modals State
  const [pendingCheckpoint, setPendingCheckpoint] = useState(null);
  const [pendingTravelEvent, setPendingTravelEvent] = useState(null);

  // Modal State for Market Trading
  const [selectedItem, setSelectedItem] = useState(null);
  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, []);

  useEffect(() => {
    if (!player) return;

    const newSocket = io(SOCKET_URL, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to market live stream:', newSocket.id);
    });

    newSocket.on('MARKET_TICK_UPDATE', (updatedMarket) => {
      setMarket(updatedMarket);
    });

    return () => newSocket.close();
  }, [player]);

  // Subscribe to state room & personal real estate cron payout listener
  useEffect(() => {
    if (socket && player?.currentLocation) {
      socket.emit('JOIN_STATE_MARKET', player.currentLocation);
      fetchMarketData();
    }

    if (socket && player?._id) {
      const payoutEventKey = `INCOME_PAYOUT_${player._id}`;

      socket.on(payoutEventKey, (data) => {
        setMessage(`💰 ${data.message}`);
        setPlayer((prev) => ({
          ...prev,
          cash: data.newCashBalance
        }));
      });

      return () => {
        socket.off(payoutEventKey);
      };
    }
  }, [socket, player?.currentLocation, player?._id]);

  const fetchPlayerData = async () => {
    try {
      const res = await api.get('/auth/me');
      setPlayer(res.data.player);
    } catch (err) {
      console.error('Session expired or invalid token', err);
      localStorage.removeItem('hustle_token');
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await api.get('/game/market');
      setMarket(res.data.market);
    } catch (err) {
      console.error('Failed to fetch market data', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('hustle_token');
      setPlayer(null);
      if (socket) socket.close();
    }
  };

  const handlePlayerUpdate = (updatedFields) => {
    setPlayer((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleTravel = async (destinationState) => {
    try {
      setMessage(`Traveling to ${destinationState}...`);
      const res = await api.post('/game/travel', { destinationState });

      // Checkpoint Inspection Triggered
      if (res.data.checkpointRequired) {
        setPendingCheckpoint({
          data: res.data.checkpointData,
          destinationState: res.data.destinationState
        });
        setMessage('');
        return;
      }

      // Random Travel Hazard Triggered
      if (res.data.eventRequired) {
        setPendingTravelEvent({
          data: res.data.eventData,
          destinationState: res.data.destinationState
        });
        setMessage('');
        return;
      }

      setMessage(res.data.message);
      setPlayer((prev) => ({
        ...prev,
        currentLocation: res.data.currentLocation,
        cash: res.data.remainingCash,
        energy: res.data.remainingEnergy
      }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Travel failed');
    }
  };

  const resolveCheckpoint = async (action, bribeAmount) => {
    if (!pendingCheckpoint) return;

    try {
      const res = await api.post('/game/travel', {
        destinationState: pendingCheckpoint.destinationState,
        resolveCheckpoint: true,
        action,
        bribeAmount
      });

      setMessage(`🚨 ${res.data.message}`);
      setPlayer((prev) => ({
        ...prev,
        currentLocation: res.data.currentLocation,
        cash: res.data.remainingCash,
        energy: res.data.remainingEnergy,
        inventory: res.data.inventory || prev.inventory
      }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resolve checkpoint');
    } finally {
      setPendingCheckpoint(null);
    }
  };

  const resolveTravelEvent = async (action, cost, energyCost) => {
    if (!pendingTravelEvent) return;

    try {
      const res = await api.post('/game/travel', {
        destinationState: pendingTravelEvent.destinationState,
        resolveEvent: true,
        selectedAction: action,
        cost,
        energyCost
      });

      setMessage(`⚠️ ${res.data.message}`);
      setPlayer((prev) => ({
        ...prev,
        currentLocation: res.data.currentLocation,
        cash: res.data.remainingCash,
        energy: res.data.remainingEnergy
      }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resolve travel event');
    } finally {
      setPendingTravelEvent(null);
    }
  };

  const openTradeModal = (item, type) => {
    setSelectedItem(item);
    setTradeType(type);
    setQuantity(1);
    setMessage('');
  };

  const closeTradeModal = () => {
    setSelectedItem(null);
    setQuantity(1);
  };

  const executeTrade = async () => {
    if (!selectedItem || quantity < 1) return;

    setIsSubmitting(true);
    const endpoint = tradeType === 'BUY' ? '/game/trade/buy' : '/game/trade/sell';

    try {
      const res = await api.post(endpoint, {
        itemId: selectedItem._id,
        quantity: parseInt(quantity, 10)
      });

      setMessage(`✅ ${res.data.message}`);
      setPlayer((prev) => ({
        ...prev,
        cash: res.data.remainingCash,
        inventory: res.data.inventory || prev.inventory
      }));
      closeTradeModal();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Transaction failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOwnedQuantity = (itemId) => {
    if (!player?.inventory) return 0;
    const found = player.inventory.find((inv) => inv.itemId === itemId || inv.itemId?._id === itemId);
    return found ? found.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-hustle-dark text-white">
        <div className="text-xl font-bold animate-pulse">Loading Southwest Hustle...</div>
      </div>
    );
  }

  if (!player) {
    return <Auth onLoginSuccess={(playerData) => setPlayer(playerData)} />;
  }

  return (
    <div className="min-h-screen bg-hustle-dark text-gray-100 p-6 relative pb-24">
      
      {/* PERSISTENT HEADER & PLAYER STATS */}
      <header className="max-w-6xl mx-auto bg-hustle-card p-6 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-hustle-green tracking-wide flex items-center gap-2">
            SOUTHWEST HUSTLE 
            <span className="text-xs text-hustle-gold uppercase font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              v1.0
            </span>
          </h1>
          <p className="text-sm text-gray-400">
            Player: <span className="text-white font-semibold">{player?.username}</span>
            {player?.isAdmin && (
              <span className="ml-2 text-[10px] bg-hustle-gold text-black font-black uppercase px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <MapPin className="w-5 h-5 text-hustle-green" />
            <div>
              <div className="text-xs text-gray-400">Location</div>
              <div className="font-bold text-white">{player?.currentLocation || 'Lagos'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Wallet className="w-5 h-5 text-hustle-gold" />
            <div>
              <div className="text-xs text-gray-400">Cash Balance</div>
              <div className="font-bold text-hustle-gold">₦{player?.cash?.toLocaleString() || '0'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Energy</div>
              <div className="font-bold text-blue-400">{player?.energy || 100}%</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2.5 bg-gray-800 hover:bg-red-950/60 hover:text-red-400 text-gray-400 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* TOP NAVIGATION TAB BAR */}
      <nav className="max-w-6xl mx-auto flex items-center gap-2 mb-8 bg-gray-900 p-1.5 rounded-xl border border-gray-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'MARKET'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Market</span>
        </button>

        <button
          onClick={() => setActiveTab('REAL_ESTATE')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'REAL_ESTATE'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Real Estate</span>
        </button>

        <button
          onClick={() => setActiveTab('ELECTIONS')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'ELECTIONS'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Elections</span>
        </button>

        <button
          onClick={() => setActiveTab('FACTIONS')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'FACTIONS'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('CARGO')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'CARGO'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'CHAT'
              ? 'bg-hustle-green text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Trade Chat</span>
        </button>

        {player?.isAdmin && (
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`flex-1 min-w-[130px] py-3 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'ADMIN'
                ? 'bg-hustle-gold text-black shadow-md'
                : 'text-hustle-gold hover:bg-amber-950/40 border border-hustle-gold/30'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Admin Command</span>
          </button>
        )}
      </nav>

      {/* DYNAMIC TAB CONTENT */}
      <main className="max-w-6xl mx-auto">
        {activeTab === 'MARKET' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-hustle-card p-6 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="text-hustle-green" />
                  {player?.currentLocation || 'Lagos'} Commodity Market
                </h2>
                <span className="text-xs bg-hustle-green/20 text-hustle-green px-3 py-1 rounded-full font-mono animate-pulse">
                  ● Live WebSocket Feed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-800 uppercase text-xs text-gray-400">
                    <tr>
                      <th className="p-3">Commodity</th>
                      <th className="p-3">Local Price</th>
                      <th className="p-3">Owned</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {market.map((item) => {
                      const ownedQty = getOwnedQuantity(item._id);
                      return (
                        <tr key={item._id} className="hover:bg-gray-800/50 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.category}</div>
                          </td>
                          <td className="p-3 font-mono text-hustle-gold font-bold">
                            ₦{item.localPrice?.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-gray-300">
                            {ownedQty}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => openTradeModal(item, 'BUY')}
                              className="bg-hustle-green hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                            >
                              Buy
                            </button>
                            <button
                              disabled={ownedQty <= 0}
                              onClick={() => openTradeModal(item, 'SELL')}
                              className={`text-xs font-bold px-3 py-1.5 rounded transition ${
                                ownedQty > 0
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              Sell
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-hustle-card p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Truck className="text-hustle-gold" />
                  Interstate Routes
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  Travel across Southwestern trade corridors. Tolls & Fuel: ₦15,000 / 20 Energy.
                </p>

                <div className="space-y-3">
                  {REGIONS.map((state) => {
                    const isCurrent = player?.currentLocation === state;
                    return (
                      <button
                        key={state}
                        disabled={isCurrent}
                        onClick={() => handleTravel(state)}
                        className={`w-full py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-between border transition ${
                          isCurrent
                            ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-hustle-green/10 border-hustle-green/40 hover:bg-hustle-green hover:text-white text-hustle-green'
                        }`}
                      >
                        <span>{state}</span>
                        <span className="text-xs font-mono">{isCurrent ? 'Current' : 'Depart ➔'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && (
                <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-hustle-gold/30 text-xs text-hustle-gold">
                  {message}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'REAL_ESTATE' && (
          <PropertyManager player={player} onPlayerUpdate={handlePlayerUpdate} />
        )}

        {activeTab === 'ELECTIONS' && (
          <UnionElection player={player} onPlayerUpdate={handlePlayerUpdate} />
        )}

        {activeTab === 'FACTIONS' && (
          <FactionLeaderboard player={player} onPlayerUpdate={handlePlayerUpdate} />
        )}

        {activeTab === 'CARGO' && (
          <CargoInspector player={player} onPlayerUpdate={handlePlayerUpdate} />
        )}

        {activeTab === 'CHAT' && (
          <TraderChat socket={socket} player={player} />
        )}

        {activeTab === 'ADMIN' && player?.isAdmin && (
          <AdminPanel player={player} onPlayerUpdate={handlePlayerUpdate} />
        )}
      </main>

      {/* TRADING MODAL POPUP */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hustle-card border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                {tradeType === 'BUY' ? (
                  <ShoppingCart className="text-hustle-green w-5 h-5" />
                ) : (
                  <DollarSign className="text-amber-500 w-5 h-5" />
                )}
                <h3 className="text-lg font-bold text-white">
                  {tradeType === 'BUY' ? 'Buy Trade Goods' : 'Sell Trade Goods'}
                </h3>
              </div>
              <button onClick={closeTradeModal} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 p-4 bg-gray-800/60 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Item:</span>
                <span className="font-semibold text-white">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unit Price:</span>
                <span className="font-mono text-hustle-gold font-bold">₦{selectedItem.localPrice?.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs uppercase font-bold text-gray-400">Quantity</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max={tradeType === 'SELL' ? Math.max(1, getOwnedQuantity(selectedItem._id)) : 50}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full accent-hustle-green cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-gray-800 border border-gray-700 rounded p-2 text-center text-white font-mono font-bold"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-lg flex justify-between items-center border border-gray-800">
                <span className="text-xs uppercase text-gray-400 font-bold">Total Cost:</span>
                <span className="text-lg font-mono font-black text-hustle-gold">
                  ₦{(selectedItem.localPrice * quantity).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeTradeModal}
                className="w-1/2 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={executeTrade}
                className={`w-1/2 py-2.5 rounded-lg font-bold text-sm text-white ${
                  tradeType === 'BUY' ? 'bg-hustle-green hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${tradeType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKPOINT INTERCEPTION MODAL */}
      {pendingCheckpoint && (
        <CheckpointModal
          checkpointData={pendingCheckpoint.data}
          destinationState={pendingCheckpoint.destinationState}
          onResolve={resolveCheckpoint}
          onCancel={() => setPendingCheckpoint(null)}
        />
      )}

      {/* TRAVEL HAZARD / EVENT MODAL */}
      {pendingTravelEvent && (
        <TravelEventModal
          eventData={pendingTravelEvent.data}
          destinationState={pendingTravelEvent.destinationState}
          onResolve={resolveTravelEvent}
          onCancel={() => setPendingTravelEvent(null)}
        />
      )}

      {/* AMBIENT SOUNDSCAPE CONTROLS */}
      <SoundEngine currentLocation={player?.currentLocation || 'Lagos'} />

    </div>
  );
}