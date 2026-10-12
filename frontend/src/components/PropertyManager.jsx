import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Building2, MapPin, Key, DollarSign, Package, 
  CheckCircle, AlertCircle, Filter, ShieldCheck 
} from 'lucide-react';

const STATES = ['All', 'Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

export default function PropertyManager({ player, onPlayerUpdate }) {
  const [properties, setProperties] = useState([]);
  const [selectedState, setSelectedState] = useState('All');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, [selectedState]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const url = selectedState === 'All' 
        ? '/properties' 
        : `/properties?state=${selectedState}`;
      const res = await api.get(url);
      setProperties(res.data.properties);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (property) => {
    setProcessingId(property._id);
    setStatusMessage(null);
    try {
      const res = await api.post('/properties/buy', { propertyId: property._id });
      setStatusMessage({ type: 'success', text: res.data.message });
      
      // Refresh local list and update player cash
      fetchProperties();
      if (onPlayerUpdate) {
        onPlayerUpdate({ cash: res.data.remainingCash });
      }
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Purchase failed' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLease = async (property) => {
    setProcessingId(property._id);
    setStatusMessage(null);
    try {
      const res = await api.post('/properties/lease', { propertyId: property._id });
      setStatusMessage({ type: 'success', text: res.data.message });
      
      fetchProperties();
      if (onPlayerUpdate) {
        onPlayerUpdate({ cash: res.data.remainingCash });
      }
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Lease agreement failed' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl">
      {/* Top Header & Regional Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-hustle-green" />
            Southwestern Real Estate Exchange
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Acquire or lease warehouses, retail shops, and depots to boost storage capacity and earn passive daily income.
          </p>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-gray-500 mr-1 shrink-0" />
          {STATES.map((state) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedState === state
                  ? 'bg-hustle-green text-white font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {state}
            </button>
          ))}
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

      {/* Property Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 font-mono text-sm animate-pulse">
          Loading property listings across {selectedState}...
        </div>
      ) : properties.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No available listings found for {selectedState}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const isOwner = prop.owner?._id === player?.id || prop.owner === player?.id;
            const isTenant = prop.tenant?._id === player?.id || prop.tenant === player?.id;
            const canAffordBuy = player?.cash >= prop.purchasePrice;
            const canAffordLease = player?.cash >= prop.rentPricePerMonth;

            return (
              <div 
                key={prop._id} 
                className={`bg-gray-900/80 rounded-xl p-5 border transition flex flex-col justify-between ${
                  isOwner 
                    ? 'border-hustle-green/80 ring-1 ring-hustle-green/30' 
                    : isTenant
                    ? 'border-hustle-gold/80'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div>
                  {/* Property Header Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-hustle-gold bg-hustle-gold/10 px-2.5 py-1 rounded-md border border-hustle-gold/20">
                      {prop.type}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-800 px-2.5 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5 text-hustle-green" />
                      {prop.state}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <h3 className="font-bold text-white text-base leading-snug mb-1">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">{prop.district}</p>

                  {/* Stats & Perks */}
                  <div className="bg-gray-800/60 rounded-lg p-3 space-y-2 mb-4 text-xs">
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Package className="w-3.5 h-3.5 text-blue-400" /> Storage Bonus:
                      </span>
                      <span className="font-mono font-bold text-white">
                        +{prop.storageCapacityBonus?.toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1 text-gray-400">
                        <DollarSign className="w-3.5 h-3.5 text-hustle-green" /> Passive Income:
                      </span>
                      <span className="font-mono font-bold text-hustle-green">
                        ₦{prop.passiveIncomePerDay?.toLocaleString()}/day
                      </span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 mb-5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Purchase Price:</span>
                      <span className="text-hustle-gold font-bold">₦{prop.purchasePrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Lease (30 Days):</span>
                      <span className="text-gray-300">₦{prop.rentPricePerMonth?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Ownership / Action Buttons */}
                <div>
                  {isOwner ? (
                    <div className="w-full py-2.5 rounded-lg bg-hustle-green/20 border border-hustle-green text-hustle-green text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> You Own This Property
                    </div>
                  ) : isTenant ? (
                    <div className="w-full py-2.5 rounded-lg bg-hustle-gold/20 border border-hustle-gold text-hustle-gold text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Key className="w-4 h-4" /> Leased (Expires in 30 Days)
                    </div>
                  ) : prop.owner ? (
                    <div className="w-full py-2.5 rounded-lg bg-gray-800 text-gray-500 text-xs font-semibold text-center">
                      Owned by {prop.owner.username || 'another player'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={!canAffordLease || prop.isRented || processingId === prop._id}
                        onClick={() => handleLease(prop)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          canAffordLease && !prop.isRented
                            ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                            : 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <Key className="w-3.5 h-3.5" /> Lease
                      </button>

                      <button
                        disabled={!canAffordBuy || processingId === prop._id}
                        onClick={() => handleBuy(prop)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          canAffordBuy
                            ? 'bg-hustle-green hover:bg-green-700 text-white'
                            : 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" /> Buy Outright
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}