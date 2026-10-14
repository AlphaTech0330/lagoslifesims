import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Wrench, ShieldCheck, Fuel, Flame, Box, 
  CheckCircle2, AlertCircle, WrenchIcon, Gauge, Truck
} from 'lucide-react';

export default function Garage({ player, onPlayerUpdate }) {
  const [upgrades, setUpgrades] = useState([]);
  const [vehicle, setVehicle] = useState(player?.vehicle || {});
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchGarageData();
  }, []);

  const fetchGarageData = async () => {
    try {
      const res = await api.get('/vehicle/upgrades');
      setUpgrades(res.data.upgrades);
      setVehicle(res.data.vehicle);
    } catch (err) {
      console.error('Failed to load garage upgrades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseUpgrade = async (upgradeId) => {
    setPurchasingId(upgradeId);
    setMessage(null);

    try {
      const res = await api.post('/vehicle/purchase-upgrade', { upgradeId });
      
      setMessage({ type: 'success', text: `✅ ${res.data.message}` });
      setVehicle(res.data.vehicle);

      // Refresh local upgrade list
      setUpgrades((prev) =>
        prev.map((up) =>
          up.id === upgradeId ? { ...up, isInstalled: true } : up
        )
      );

      // Update global player state (cash & extra storage)
      if (onPlayerUpdate) {
        onPlayerUpdate({
          cash: res.data.remainingCash,
          vehicle: res.data.vehicle
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `❌ ${err.response?.data?.message || 'Upgrade installation failed.'}`
      });
    } finally {
      setPurchasingId(null);
    }
  };

  const getUpgradeIcon = (type) => {
    switch (type) {
      case 'TIRES': return <ShieldCheck className="w-6 h-6 text-hustle-green" />;
      case 'FUEL_TANK': return <Fuel className="w-6 h-6 text-red-400" />;
      case 'COOLING': return <Flame className="w-6 h-6 text-blue-400" />;
      case 'CARGO_BAY': return <Box className="w-6 h-6 text-hustle-gold" />;
      default: return <Wrench className="w-6 h-6 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-hustle-card p-12 rounded-xl border border-gray-800 text-center">
        <Wrench className="w-8 h-8 text-hustle-green animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-300">Loading Auto Workshop Catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* VEHICLE DASHBOARD HEADER */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="text-hustle-green w-6 h-6" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              {vehicle.name || 'Standard Bedford Lorry'}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Install heavy-duty modifications to mitigate highway breakdowns, bypass fuel spikes, and expand cargo payload.
          </p>
        </div>

        {/* VEHICLE STAT BADGES */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Gauge className="w-5 h-5 text-hustle-green" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono uppercase">Vehicle Condition</div>
              <div className="text-xs font-bold text-white">{vehicle.durability || 100}% Operational</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Box className="w-5 h-5 text-hustle-gold" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono uppercase">Bonus Payload</div>
              <div className="text-xs font-bold text-hustle-gold">+{vehicle.extraStorage || 0} Cargo Space</div>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION MESSAGE BANNER */}
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

      {/* UPGRADE CATALOG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upgrades.map((upgrade) => {
          const isInstalled = upgrade.isInstalled;
          const canAfford = (player?.cash || 0) >= upgrade.cost;

          return (
            <div 
              key={upgrade.id}
              className={`p-6 rounded-xl border transition flex flex-col justify-between ${
                isInstalled
                  ? 'bg-green-950/20 border-hustle-green/40'
                  : 'bg-hustle-card border-gray-800 hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
                      {getUpgradeIcon(upgrade.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{upgrade.name}</h3>
                      <span className="text-[10px] font-mono text-gray-400 uppercase bg-gray-800 px-2 py-0.5 rounded">
                        {upgrade.type}
                      </span>
                    </div>
                  </div>

                  <span className={`text-sm font-mono font-black ${isInstalled ? 'text-hustle-green' : 'text-hustle-gold'}`}>
                    {isInstalled ? 'INSTALLED' : `₦${upgrade.cost.toLocaleString()}`}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed my-4">
                  {upgrade.description}
                </p>

                {/* STAT IMPACT PILLS */}
                <div className="flex items-center gap-2 flex-wrap mb-6 text-[11px] font-mono">
                  {upgrade.breakdownReductionPct > 0 && (
                    <span className="bg-green-950/60 border border-green-800/60 text-green-300 px-2.5 py-1 rounded-lg">
                      🛡️ -{(upgrade.breakdownReductionPct * 100)}% Breakdown Chance
                    </span>
                  )}
                  {upgrade.fuelCostDiscountPct > 0 && (
                    <span className="bg-red-950/60 border border-red-800/60 text-red-300 px-2.5 py-1 rounded-lg">
                      ⛽ -{(upgrade.fuelCostDiscountPct * 100)}% Travel Fuel Cost
                    </span>
                  )}
                  {upgrade.storageBonus > 0 && (
                    <span className="bg-amber-950/60 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-lg">
                      📦 +{upgrade.storageBonus} Extra Cargo Space
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION BUTTON */}
              {isInstalled ? (
                <div className="w-full py-3 rounded-xl bg-hustle-green/10 border border-hustle-green/40 text-hustle-green font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Equipped & Active</span>
                </div>
              ) : (
                <button
                  disabled={!canAfford || purchasingId === upgrade.id}
                  onClick={() => handlePurchaseUpgrade(upgrade.id)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                    canAfford
                      ? 'bg-hustle-green hover:bg-green-700 text-white cursor-pointer'
                      : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <WrenchIcon className="w-4 h-4" />
                  <span>
                    {purchasingId === upgrade.id
                      ? 'Installing Upgrade...'
                      : canAfford
                      ? 'Purchase & Install Upgrade'
                      : 'Insufficient Funds'}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}