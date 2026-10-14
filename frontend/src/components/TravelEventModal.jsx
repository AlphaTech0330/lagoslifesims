import React, { useState } from 'react';
import { AlertTriangle, Wrench, Fuel, CloudRain, Shield } from 'lucide-react';

export default function TravelEventModal({ eventData, destinationState, onResolve, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEventIcon = (type) => {
    switch (type) {
      case 'BREAKDOWN': return <Wrench className="w-6 h-6 text-amber-400" />;
      case 'FUEL_SHORTAGE': return <Fuel className="w-6 h-6 text-red-400" />;
      case 'WEATHER': return <CloudRain className="w-6 h-6 text-blue-400" />;
      default: return <AlertTriangle className="w-6 h-6 text-hustle-gold" />;
    }
  };

  const handleSelectOption = async (option) => {
    setIsSubmitting(true);
    await onResolve(option.action, option.cost, option.energyCost);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-hustle-card border border-amber-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-800">
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
            {getEventIcon(eventData.type)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{eventData.title}</h3>
            <p className="text-xs text-hustle-gold font-mono">En Route to {destinationState}</p>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-xs text-gray-300 leading-relaxed mb-6 bg-gray-900 p-3.5 rounded-xl border border-gray-800">
          {eventData.message}
        </p>

        {/* Option Selection */}
        <div className="space-y-3">
          {eventData.options.map((opt, idx) => (
            <button
              key={idx}
              disabled={isSubmitting}
              onClick={() => handleSelectOption(opt)}
              className="w-full p-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-hustle-green text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-xs text-white group-hover:text-hustle-green">
                  {opt.label}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{opt.description}</div>
              </div>
            </button>
          ))}

          <button
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition mt-2"
          >
            Turn Back & Return Home
          </button>
        </div>

      </div>
    </div>
  );
}