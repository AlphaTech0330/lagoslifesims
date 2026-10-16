import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Repeat, ShoppingBag, DollarSign, PlusCircle, 
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Lock 
} from 'lucide-react';

export default function P2PExchange({ player, onPlayerUpdate }) {
  const [contracts, setContracts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Modal State for Posting New Escrow Contracts
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderType, setOrderType] = useState('SELL_ORDER'); // 'SELL_ORDER' or 'BUY_ORDER'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [pricePerUnit, setPricePerUnit] = useState(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLocation = player?.currentLocation || 'Lagos';

  useEffect(() => {
    fetchContractsAndItems();
  }, [currentLocation]);

  const fetchContractsAndItems = async () => {
    try {
      setLoading(true);
      const [contractsRes, marketRes] = await Promise.all([
        api.get(`/trade-contracts/${currentLocation}`),
        api.get('/game/market')
      ]);

      setContracts(contractsRes.data.contracts || []);
      setItems(marketRes.data.market || []);

      if (marketRes.data.market?.length > 0) {
        setSelectedItemId(marketRes.data.market[0]._id);
      }
    } catch (err) {
      console.error('Failed to load trade contracts:', err);
      setMessage({ type: 'error', text: 'Could not fetch regional P2P trade listings.' });
    } finally {
      setLoading(false);
    }
  };

  // Create & Lock Escrow Contract
  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0 || pricePerUnit <= 0) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/trade-contracts/create', {
        type: orderType,
        itemId: selectedItemId,
        quantity: parseInt(quantity, 10),
        pricePerUnit: parseInt(pricePerUnit, 10)
      });

      setMessage({ type: 'success', text: `✅ ${res.data.message}` });

      if (onPlayerUpdate) {
        onPlayerUpdate({
          cash: res.data.remainingCash,
          inventory: res.data.inventory
        });
      }

      setShowCreateModal(false);
      fetchContractsAndItems(); // Refresh active listings
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err.response?.data?.message || 'Failed to post escrow contract.'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fulfill Escrow Contract
  const handleFulfillContract = async (contractId) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/trade-contracts/fulfill', { contractId });

      setMessage({ type: 'success', text: `✅ ${res.data.message}` });

      if (onPlayerUpdate) {
        onPlayerUpdate({
          cash: res.data.remainingCash,
          inventory: res.data.inventory
        });
      }

      fetchContractsAndItems();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err.response?.data?.message || 'Trade fulfillment failed.'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-hustle-card p-12 rounded-xl border border-gray-800 text-center">
        <Repeat className="w-8 h-8 text-hustle-green animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-gray-400">Loading {currentLocation} Escrow Exchange...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Repeat className="text-hustle-green" /> P2P Escrow Market Exchange
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Trade goods directly with other players in <span className="text-white font-semibold">{currentLocation}</span> with secured escrow backing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-hustle-green hover:bg-green-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Trade Contract</span>
        </button>
      </div>

      {/* NOTIFICATION MESSAGE */}
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

      {/* CONTRACT LISTINGS TABLE */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-800">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ShoppingBag className="text-hustle-gold w-5 h-5" /> Active Regional Listings ({currentLocation})
          </h3>
          <span className="text-xs font-mono text-gray-400">Escrow Protected</span>
        </div>

        {contracts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No open P2P contracts posted in <span className="text-white font-semibold">{currentLocation}</span>. Click <span className="text-hustle-green font-bold">Post Trade Contract</span> to list your items or cash buy orders.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800 uppercase text-xs text-gray-400">
                <tr>
                  <th className="p-3">Trader</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Price / Unit</th>
                  <th className="p-3">Total Value</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {contracts.map((c) => {
                  const isSelf = (c.creator?._id || c.creator) === player?._id;
                  const totalValue = c.quantity * c.pricePerUnit;

                  return (
                    <tr key={c._id} className="hover:bg-gray-800/50 transition">
                      <td className="p-3 font-semibold text-white">
                        {c.creator?.username || 'Trader'}
                        {isSelf && <span className="ml-1.5 text-[10px] bg-gray-800 text-hustle-gold px-1.5 py-0.5 rounded font-mono">YOU</span>}
                      </td>

                      <td className="p-3">
                        {c.type === 'SELL_ORDER' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg">
                            <ArrowUpRight className="w-3.5 h-3.5" /> SELLING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-hustle-green bg-green-950/40 border border-green-800/50 px-2.5 py-1 rounded-lg">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> BUYING
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-semibold text-white">
                        {c.item?.name || 'Commodity'}
                      </td>

                      <td className="p-3 font-mono font-bold text-white">
                        {c.quantity} units
                      </td>

                      <td className="p-3 font-mono text-hustle-gold font-bold">
                        ₦{c.pricePerUnit?.toLocaleString()}
                      </td>

                      <td className="p-3 font-mono text-white font-bold">
                        ₦{totalValue?.toLocaleString()}
                      </td>

                      <td className="p-3 text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-500 font-mono italic">Listed by you</span>
                        ) : (
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleFulfillContract(c._id)}
                            className="bg-hustle-green hover:bg-green-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                          >
                            Fulfill Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ESCROW CONTRACT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hustle-card border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="text-hustle-green w-5 h-5" /> Create Escrow Trade Contract
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Lock cash or goods into regional escrow until another player fulfills your trade order.
            </p>

            <form onSubmit={handleCreateContract} className="space-y-4">
              {/* Order Type Toggle */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Contract Type</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderType('SELL_ORDER')}
                    className={`py-2 rounded-lg font-bold transition ${
                      orderType === 'SELL_ORDER'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sell Items Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('BUY_ORDER')}
                    className={`py-2 rounded-lg font-bold transition ${
                      orderType === 'BUY_ORDER'
                        ? 'bg-hustle-green text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Buy Items Order
                  </button>
                </div>
              </div>

              {/* Commodity Selection */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Select Commodity</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white"
                >
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>{item.name} ({item.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Price Per Unit (₦)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Escrow Value Summary */}
              <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase">Total Escrow Lock:</span>
                <span className="font-mono font-black text-hustle-gold text-sm">
                  ₦{(quantity * pricePerUnit).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-hustle-green hover:bg-green-700 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Locking Escrow...' : 'Post & Lock Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}