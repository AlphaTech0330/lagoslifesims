import React, { useState } from 'react';
import api from '../services/api';
import { 
  Truck, Package, AlertTriangle, ShieldAlert, 
  Trash2, ArrowUpRight, HardDrive, DollarSign, CheckCircle2 
} from 'lucide-react';

export default function CargoInspector({ player, onPlayerUpdate }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [dumpQty, setDumpQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  // Default vehicle capacity + real estate bonus calculation
  const BASE_TRUCK_CAPACITY = 100; // units
  const extraStorage = player?.extraStorageCapacity || 0;
  const maxCapacity = BASE_TRUCK_CAPACITY + extraStorage;

  // Calculate current total payload units
  const currentPayloadUnits = player?.inventory?.reduce(
    (total, item) => total + (item.quantity || 0), 0
  ) || 0;

  const usagePercentage = Math.min(100, Math.round((currentPayloadUnits / maxCapacity) * 100));

  // Handle jettisoning/dumping unwanted cargo to free up space
  const handleDumpCargo = async () => {
    if (!selectedItem || dumpQty <= 0) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      // Dump cargo via sell/drop API endpoint
      const res = await api.post('/game/trade/sell', {
        itemId: selectedItem.itemId?._id || selectedItem.itemId,
        quantity: parseInt(dumpQty, 10)
      });

      setMessage({
        type: 'success',
        text: `Liquidated ${dumpQty} units of ${selectedItem.itemId?.name || 'cargo'} for ₦${res.data.remainingCash ? (res.data.remainingCash - player.cash).toLocaleString() : '0'}`
      });

      if (onPlayerUpdate) {
        onPlayerUpdate({
          cash: res.data.remainingCash,
          inventory: res.data.inventory
        });
      }

      setSelectedItem(null);
      setDumpQty(1);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to clear cargo item'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl">
      
      {/* Top Header & Vehicle Spec */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-hustle-green" />
            Cargo Payload & Storage Inspector
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Monitor Bedford & Mack truck payload limits across Southwestern interstate trade corridors.
          </p>
        </div>

        {/* Vehicle Spec Badge */}
        <div className="flex items-center gap-3 bg-gray-900 px-4 py-2.5 rounded-xl border border-gray-800">
          <HardDrive className="w-5 h-5 text-hustle-gold" />
          <div className="text-xs">
            <div className="text-gray-400 font-mono">Vehicle Specs</div>
            <div className="font-bold text-white">Bedford Heavy Hauler</div>
          </div>
        </div>
      </div>

      {/* Payload Capacity Bar */}
      <div className="mb-8 bg-gray-900 p-5 rounded-xl border border-gray-800">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-hustle-green" /> Cargo Volume Utilization
          </span>
          <span className="font-mono font-bold text-white">
            {currentPayloadUnits} / {maxCapacity} Units ({usagePercentage}%)
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-gray-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-700">
          <div
            style={{ width: `${usagePercentage}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              usagePercentage > 90
                ? 'bg-red-500'
                : usagePercentage > 75
                ? 'bg-amber-500'
                : 'bg-hustle-green'
            }`}
          />
        </div>

        {/* Capacity Breakdown Footer */}
        <div className="flex flex-wrap justify-between items-center text-[11px] text-gray-400 mt-3 font-mono">
          <span>Base Truck Capacity: {BASE_TRUCK_CAPACITY} Units</span>
          <span>Warehouse Bonus: +{extraStorage} Units</span>
          {usagePercentage >= 90 && (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Payload near capacity limit!
            </span>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
          message.type === 'success' 
            ? 'bg-green-950/40 border-hustle-green/50 text-green-300' 
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Inventory Item Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800 uppercase text-xs text-gray-400">
            <tr>
              <th className="p-3">Cargo Item</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Share of Capacity</th>
              <th className="p-3 text-right">Quick Liquidate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!player?.inventory || player.inventory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500 text-xs">
                  Your truck bed is completely empty. Visit the Commodity Market to purchase trade goods.
                </td>
              </tr>
            ) : (
              player.inventory.map((item, idx) => {
                const itemName = item.itemId?.name || 'Trade Good';
                const itemCat = item.itemId?.category || 'General Commodity';
                const itemShare = Math.round(((item.quantity || 0) / maxCapacity) * 100);

                return (
                  <tr key={item._id || idx} className="hover:bg-gray-800/50 transition">
                    <td className="p-3">
                      <div className="font-semibold text-white">{itemName}</div>
                      <div className="text-xs text-gray-400">{itemCat}</div>
                    </td>
                    <td className="p-3 font-mono text-hustle-gold font-bold">
                      {item.quantity} units
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-300">
                      {itemShare}%
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="bg-red-950/60 border border-red-800 hover:bg-red-800 text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Liquidate
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QUICK LIQUIDATE / DUMP MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hustle-card border border-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="text-red-400" /> Liquidate Cargo
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Sell off or unload <span className="text-white font-semibold">{selectedItem.itemId?.name}</span> to free up truck volume.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                  Units to Offload (Max: {selectedItem.quantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={dumpQty}
                  onChange={(e) => setDumpQty(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-center text-white font-mono font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-1/2 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleDumpCargo}
                  className="w-1/2 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition"
                >
                  {isProcessing ? 'Offloading...' : 'Confirm Liquidate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}