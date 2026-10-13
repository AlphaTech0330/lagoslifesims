import React, { useState } from 'react';
import { Calculator, TrendingUp, ArrowRight, LocalFreight, DollarSign } from 'lucide-react';

const COMMODITIES = [
  { id: 'cocoa', name: 'Unprocessed Cocoa', basePrice: 50000, multipliers: { Lagos: 1.0, Ibadan: 1.3, Kwara: 1.8 } },
  { id: 'timber', name: 'Teak Timber', basePrice: 35000, multipliers: { Lagos: 1.6, Ibadan: 1.1, Kwara: 0.9 } },
  { id: 'cassava', name: 'Cassava Flour', basePrice: 12000, multipliers: { Lagos: 1.5, Ibadan: 1.0, Kwara: 1.2 } },
  { id: 'electronics', name: 'Consumer Electronics', basePrice: 120000, multipliers: { Lagos: 0.8, Ibadan: 1.2, Kwara: 1.5 } }
];

const REGIONS = ['Lagos', 'Ibadan', 'Kwara'];
const TRAVEL_OVERHEAD = 15000; // Fuel & Toll cost per interstate haul

export default function TradeCalculator() {
  const [selectedCommodity, setSelectedCommodity] = useState(COMMODITIES[0]);
  const [buyRegion, setBuyRegion] = useState('Lagos');
  const [sellRegion, setSellRegion] = useState('Kwara');
  const [quantity, setQuantity] = useState(20);

  // Price & Profit Calculations
  const buyUnitPrice = Math.round(selectedCommodity.basePrice * selectedCommodity.multipliers[buyRegion]);
  const sellUnitPrice = Math.round(selectedCommodity.basePrice * selectedCommodity.multipliers[sellRegion]);

  const totalBuyCost = buyUnitPrice * quantity;
  const grossRevenue = sellUnitPrice * quantity;
  const netProfit = grossRevenue - totalBuyCost - (buyRegion !== sellRegion ? TRAVEL_OVERHEAD : 0);
  const roi = totalBuyCost > 0 ? ((netProfit / totalBuyCost) * 100).toFixed(1) : 0;

  return (
    <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-hustle-green" /> Regional Trade Margin Calculator
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simulate arbitrage margins and transportation costs across Lagos, Ibadan, and Kwara trade routes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4 bg-gray-900 p-5 rounded-xl border border-gray-800">
          <div>
            <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Select Commodity</label>
            <select
              value={selectedCommodity.id}
              onChange={(e) => setSelectedCommodity(COMMODITIES.find((c) => c.id === e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5"
            >
              {COMMODITIES.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Buy Location</label>
              <select
                value={buyRegion}
                onChange={(e) => setBuyRegion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5"
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Sell Location</label>
              <select
                value={sellRegion}
                onChange={(e) => setSellRegion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5"
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Cargo Volume (Units)</span>
              <span className="text-hustle-gold font-mono">{quantity} Units</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full accent-hustle-green cursor-pointer"
            />
          </div>
        </div>

        {/* Calculation Readout */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Buying Price ({buyRegion}):</span>
              <span className="font-mono text-white font-bold">₦{buyUnitPrice.toLocaleString()} / unit</span>
            </div>

            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Selling Price ({sellRegion}):</span>
              <span className="font-mono text-white font-bold">₦{sellUnitPrice.toLocaleString()} / unit</span>
            </div>

            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Transport Tolls & Fuel:</span>
              <span className="font-mono text-amber-400 font-bold">
                {buyRegion !== sellRegion ? `-₦${TRAVEL_OVERHEAD.toLocaleString()}` : '₦0 (Local Trade)'}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Estimated Gross Revenue:</span>
              <span className="font-mono text-white font-bold">₦{grossRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Net Profit Display */}
          <div className={`mt-4 p-4 rounded-xl border ${
            netProfit >= 0 ? 'bg-green-950/40 border-hustle-green/50' : 'bg-red-950/40 border-red-800/50'
          }`}>
            <div className="text-xs uppercase font-bold text-gray-400">Projected Net Profit</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-mono font-black ${netProfit >= 0 ? 'text-hustle-green' : 'text-red-400'}`}>
                ₦{netProfit.toLocaleString()}
              </span>
              <span className="text-xs font-mono font-bold text-hustle-gold">
                ROI: {roi}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}