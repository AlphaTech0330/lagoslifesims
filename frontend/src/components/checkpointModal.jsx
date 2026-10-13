import React, { useState } from 'react';
import { ShieldAlert, DollarSign, PackageX, AlertTriangle } from 'lucide-react';

export default function CheckpointModal({ checkpointData, destinationState, onResolve, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action) => {
    setIsSubmitting(true);
    await onResolve(action, checkpointData.bribeAmount);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-hustle-card border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-800">
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {checkpointData.location}
            </h3>
            <p className="text-xs text-red-400 font-mono">En Route to {destinationState}</p>
          </div>
        </div>

        {/* Story & Description */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          {checkpointData.message}
        </p>

        {/* Cargo Contraband Warning */}
        {checkpointData.hasIllegalGoods && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs space-y-1">
            <div className="font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Flagged Contraband Detected:
            </div>
            <ul className="list-disc list-inside text-gray-300 pl-1 font-mono">
              {checkpointData.illegalGoods.map((g, idx) => (
                <li key={idx}>{g.itemId?.name || 'Regulated Item'} ({g.quantity} units)</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled={isSubmitting}
            onClick={() => handleAction('BRIBE')}
            className="w-full py-3 px-4 rounded-xl bg-hustle-gold/10 hover:bg-hustle-gold hover:text-black border border-hustle-gold text-hustle-gold font-bold text-xs transition flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> 
              {checkpointData.hasIllegalGoods ? 'Pay Off Officers (Bribe)' : 'Pay Union Toll'}
            </span>
            <span className="font-mono">₦{checkpointData.bribeAmount?.toLocaleString()}</span>
          </button>

          {checkpointData.hasIllegalGoods && (
            <button
              disabled={isSubmitting}
              onClick={() => handleAction('SURRENDER')}
              className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <PackageX className="w-4 h-4 text-red-400" /> Surrender Regulated Cargo
              </span>
              <span className="font-mono text-gray-500">Free Pass</span>
            </button>
          )}

          <button
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Turn Back & Cancel Travel
          </button>
        </div>

      </div>
    </div>
  );
}