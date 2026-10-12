import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  MapPin, 
  Wallet, 
  Package, 
  ArrowRightLeft, 
  ArrowUpRight, 
  RefreshCw 
} from 'lucide-react';

const STATES = ['Lagos', 'Ibadan', 'Ogun', 'Osun', 'Kwara'];

const INITIAL_COMMODITIES = {
  Lagos: [
    { id: '1', name: 'Kwara Yam Tubers', category: 'Raw Food', price: 3600, trend: 'UP', change: 12.5, stock: 120 },
    { id: '2', name: 'Osogbo Adire Textile', category: 'Luxury/Art', price: 21600, trend: 'UP', change: 8.2, stock: 45 },
    { id: '3', name: 'Agbara Manufactured Plastics', category: 'Manufactured', price: 8100, trend: 'DOWN', change: -3.4, stock: 300 },
    { id: '4', name: 'Lagos Tech Hardware Parts', category: 'Tech', price: 153000, trend: 'UP', change: 15.0, stock: 20 }
  ],
  Ibadan: [
    { id: '1', name: 'Kwara Yam Tubers', category: 'Raw Food', price: 2400, trend: 'DOWN', change: -4.1, stock: 450 },
    { id: '2', name: 'Osogbo Adire Textile', category: 'Luxury/Art', price: 14400, trend: 'UP', change: 2.1, stock: 80 },
    { id: '3', name: 'Agbara Manufactured Plastics', category: 'Manufactured', price: 5400, trend: 'DOWN', change: -1.5, stock: 600 },
    { id: '4', name: 'Ibadan Farm Eggs (Crate)', category: 'Raw Food', price: 3840, trend: 'UP', change: 5.6, stock: 500 }
  ],
  Ogun: [
    { id: '1', name: 'Kwara Yam Tubers', category: 'Raw Food', price: 2000, trend: 'UP', change: 1.2, stock: 300 },
    { id: '3', name: 'Agbara Manufactured Plastics', category: 'Manufactured', price: 4500, trend: 'DOWN', change: -8.0, stock: 1200 },
    { id: '4', name: 'Lagos Tech Hardware Parts', category: 'Tech', price: 85000, trend: 'DOWN', change: -2.0, stock: 60 }
  ],
  Osun: [
    { id: '1', name: 'Kwara Yam Tubers', category: 'Raw Food', price: 1600, trend: 'DOWN', change: -6.5, stock: 600 },
    { id: '2', name: 'Osogbo Adire Textile', category: 'Luxury/Art', price: 9600, trend: 'DOWN', change: -10.5, stock: 250 }
  ],
  Kwara: [
    { id: '1', name: 'Kwara Yam Tubers', category: 'Raw Food', price: 1200, trend: 'DOWN', change: -14.2, stock: 2000 },
    { id: '4', name: 'Ibadan Farm Eggs (Crate)', category: 'Raw Food', price: 3200, trend: 'UP', change: 3.4, stock: 400 }
  ]
};

export default function TradingDashboard() {
  const [currentLocation, setCurrentLocation] = useState('Lagos');
  const [player, setPlayer] = useState({
    cash: 350000,
    energy: 85,
    truck: {
      name: 'Haulage Truck Tier 1',
      maxCapacity: 5000, // in kg
      currentPayload: 1800
    }
  });

  const [tradeQuantities, setTradeQuantities] = useState({});
  const [isTraveling, setIsTraveling] = useState(false);

  const marketCatalog = INITIAL_COMMODITIES[currentLocation] || [];

  const handleQuantityChange = (itemId, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    setTradeQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleBuy = (item) => {
    const qty = tradeQuantities[item.id] || 0;
    if (qty <= 0) return;

    const totalCost = item.price * qty;
    if (player.cash < totalCost) {
      alert('Insufficient funds!');
      return;
    }

    setPlayer((prev) => ({
      ...prev,
      cash: prev.cash - totalCost,
      truck: {
        ...prev.truck,
        currentPayload: prev.truck.currentPayload + qty * 10
      }
    }));

    setTradeQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  const handleTravel = (destination) => {
    if (destination === currentLocation) return;
    setIsTraveling(true);

    setTimeout(() => {
      setCurrentLocation(destination);
      setPlayer((prev) => ({
        ...prev,
        cash: prev.cash - 12500,
        energy: Math.max(0, prev.energy - 15)
      }));
      setIsTraveling(false);
    }, 1200);
  };

  const capacityPercentage = Math.round(
    (player.truck.currentPayload / player.truck.maxCapacity) * 100
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400 flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7" /> Southwestern Arbitrage Hub
          </h1>
          <p className="text-sm text-slate-400">
            Real-time interstate commodity exchange market
          </p>
        </div>

        {/* Player Stats Widgets */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400">Liquid Cash</div>
              <div className="text-lg font-bold text-white">
                ₦{player.cash.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-slate-400">Truck Load</div>
              <div className="text-sm font-semibold text-white">
                {player.truck.currentPayload} / {player.truck.maxCapacity} kg ({capacityPercentage}%)
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Regional Map & Interstate Travel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" /> Current Hub: <span className="text-emerald-400">{currentLocation}</span>
            </h2>

            <p className="text-xs text-slate-400 mb-4">
              Select a state to travel along major expressways. Travel consumes fuel (₦12,500) and energy.
            </p>

            <div className="space-y-2">
              {STATES.map((state) => {
                const isActive = state === currentLocation;
                return (
                  <button
                    key={state}
                    disabled={isTraveling || isActive}
                    onClick={() => handleTravel(state)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <span>{state}</span>
                    {isActive ? (
                      <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Active</span>
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Truck Payload Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" /> Haulage Capacity
            </h3>
            <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  capacityPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{player.truck.maxCapacity - player.truck.currentPayload} kg available</span>
              <span>{capacityPercentage}% Full</span>
            </div>
          </div>
        </div>

        {/* Main Content: Market Commodity Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {currentLocation} Commodity Exchange
                </h2>
                <p className="text-xs text-slate-400">
                  Buy low in production hubs, travel, and sell high in demand zones.
                </p>
              </div>

              <button
                onClick={() => alert('Refreshing live market feeds...')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Refresh Market Prices"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Commodity Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketCatalog.map((item) => {
                const qty = tradeQuantities[item.id] || 0;
                const totalCost = item.price * qty;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {item.category}
                          </span>
                          <h3 className="text-lg font-semibold text-white mt-1">
                            {item.name}
                          </h3>
                        </div>

                        {/* Trend Badge */}
                        <div
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                            item.trend === 'UP'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.trend === 'UP' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>{item.change}%</span>
                        </div>
                      </div>

                      <div className="my-4">
                        <div className="text-xs text-slate-400">Unit Price</div>
                        <div className="text-2xl font-extrabold text-emerald-400">
                          ₦{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Trade Input and Actions */}
                    <div className="pt-4 border-t border-slate-900 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={tradeQuantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                        <div className="text-xs text-slate-400 flex-1 text-right">
                          Total: <span className="text-white font-semibold">₦{totalCost.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={qty <= 0 || player.cash < totalCost}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                        >
                          Buy Cargo
                        </button>
                        <button
                          onClick={() => alert(`Sold ${qty} units of ${item.name}`)}
                          disabled={qty <= 0}
                          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                        >
                          Sell Cargo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}