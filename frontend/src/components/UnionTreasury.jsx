import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BuildingBank, Landmark, PiggyBank, Receipt, 
  ShieldCheck, Crown, ArrowUpRight, TrendingUp 
} from 'lucide-react';

export default function UnionTreasury({ player }) {
  const [region, setRegion] = useState(player?.currentLocation || 'Lagos');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const REGIONS = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

  useEffect(() => {
    fetchTreasuryData(region);
  }, [region]);

  const fetchTreasuryData = async (targetRegion) => {
    setLoading(true);
    try {
      const res = await api.get(`/elections/treasury/${targetRegion}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load treasury ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-hustle-card p-12 rounded-xl border border-gray-800 text-center">
        <Landmark className="w-8 h-8 text-hustle-gold animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-gray-400">Auditing {region} Union Treasury Ledger...</p>
      </div>
    );
  }

  const isChairman = data?.chairman?._id === player?._id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* REGIONAL SELECTOR HEADER */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="text-hustle-gold" /> {region} Union Treasury & Tax Ledger
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time audit of 2% P2P exchange tax commissions, election reserves, and Chairman payouts.
          </p>
        </div>

        {/* Region Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1.5 rounded-xl border border-gray-800 overflow-x-auto">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                region === r
                  ? 'bg-hustle-gold text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Taxes Collected */}
        <div className="bg-hustle-card p-5 rounded-xl border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Accumulated 2% Tax</span>
            <PiggyBank className="w-5 h-5 text-hustle-gold" />
          </div>
          <div className="text-2xl font-mono font-black text-hustle-gold">
            ₦{data?.totalTaxesCollected?.toLocaleString() || '0'}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">2% levied on all completed P2P trade contracts in {region}.</p>
        </div>

        {/* P2P Trade Volume */}
        <div className="bg-hustle-card p-5 rounded-xl border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">P2P Trade Volume</span>
            <TrendingUp className="w-5 h-5 text-hustle-green" />
          </div>
          <div className="text-2xl font-mono font-black text-white">
            ₦{data?.totalVolume?.toLocaleString() || '0'}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Gross commodity value exchanged in {region}.</p>
        </div>

        {/* Elected Chairman Card */}
        <div className="bg-hustle-card p-5 rounded-xl border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-gray-400">Union Chairman</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {data?.chairman ? (
              <>
                <span>{data.chairman.username}</span>
                {isChairman && (
                  <span className="text-[10px] bg-hustle-gold text-black font-black uppercase px-1.5 py-0.5 rounded">
                    YOU
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500 italic">Seat Vacant</span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Receives 2% tax commission automatically on every trade.</p>
        </div>
      </div>

      {/* TAX LEDGER TRANSACTION HISTORY */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800">
        <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2 pb-3 border-b border-gray-800">
          <Receipt className="text-hustle-green w-5 h-5" /> Recent Regional Tax Ledger Entries
        </h3>

        {!data?.ledger || data.ledger.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No P2P trades executed in <span className="text-white font-semibold">{region}</span> yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800 uppercase text-xs text-gray-400">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Gross Trade</th>
                  <th className="p-3 text-right">2% Tax Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-800/50 transition">
                    <td className="p-3 font-mono text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-semibold text-white">{entry.seller}</td>
                    <td className="p-3 font-semibold text-white">{entry.buyer}</td>
                    <td className="p-3 text-gray-300">{entry.quantity}x {entry.commodity}</td>
                    <td className="p-3 font-mono text-white">₦{entry.grossValue?.toLocaleString()}</td>
                    <td className="p-3 font-mono text-hustle-gold font-bold text-right">
                      +₦{entry.taxCollected?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}