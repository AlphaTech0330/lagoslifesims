import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, Truck, Store, Sliders, Music } from 'lucide-react';

export default function SoundEngine({ currentLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [masterMute, setMasterMute] = useState(false);

  // Volume States (0.0 to 1.0)
  const [trafficVol, setTrafficVol] = useState(0.3);
  const [marketVol, setMarketVol] = useState(0.2);
  const [radioVol, setRadioVol] = useState(0.4);

  // Active Toggles
  const [trafficActive, setTrafficActive] = useState(false);
  const [marketActive, setMarketActive] = useState(false);
  const [radioActive, setRadioActive] = useState(false);

  // Audio Context & Nodes Ref
  const audioCtxRef = useRef(null);
  const nodesRef = useRef({});

  // Initialize Web Audio Context
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Resume AudioContext on first user click (Browser Autoplay Policy)
  const ensureAudioContext = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // --- 1. PROCEDURAL TRAFFIC RUMBLE GENERATOR ---
  useEffect(() => {
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (trafficActive && !masterMute) {
      if (!nodesRef.current.trafficGain) {
        // Low-frequency noise for diesel truck engines
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(locationFreqMultiplier(currentLocation, 180), ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(trafficVol, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        nodesRef.current.trafficSource = whiteNoise;
        nodesRef.current.trafficFilter = filter;
        nodesRef.current.trafficGain = gainNode;
      } else {
        nodesRef.current.trafficGain.gain.setValueAtTime(trafficVol, ctx.currentTime);
        nodesRef.current.trafficFilter.frequency.setValueAtTime(locationFreqMultiplier(currentLocation, 180), ctx.currentTime);
      }
    } else {
      if (nodesRef.current.trafficGain) {
        nodesRef.current.trafficGain.gain.setValueAtTime(0, ctx.currentTime);
      }
    }
  }, [trafficActive, trafficVol, masterMute, currentLocation]);

  // --- 2. PROCEDURAL MARKET CHATTER SIMULATOR ---
  useEffect(() => {
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (marketActive && !masterMute) {
      if (!nodesRef.current.marketGain) {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        // Bandpass filter to simulate mid-range human chatter frequencies
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(marketVol, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        nodesRef.current.marketSource = noise;
        nodesRef.current.marketGain = gainNode;
      } else {
        nodesRef.current.marketGain.gain.setValueAtTime(marketVol, ctx.currentTime);
      }
    } else {
      if (nodesRef.current.marketGain) {
        nodesRef.current.marketGain.gain.setValueAtTime(0, ctx.currentTime);
      }
    }
  }, [marketActive, marketVol, masterMute]);

  // --- 3. REGIONAL RADIO SYNTH CHORD LOOP ---
  useEffect(() => {
    ensureAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (radioActive && !masterMute) {
      if (!nodesRef.current.radioGain) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(locationRadioFreq(currentLocation), ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(radioVol * 0.15, ctx.currentTime); // keep synth soft

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        nodesRef.current.radioOsc = osc;
        nodesRef.current.radioGain = gainNode;
      } else {
        nodesRef.current.radioGain.gain.setValueAtTime(radioVol * 0.15, ctx.currentTime);
        nodesRef.current.radioOsc.frequency.setValueAtTime(locationRadioFreq(currentLocation), ctx.currentTime);
      }
    } else {
      if (nodesRef.current.radioGain) {
        nodesRef.current.radioGain.gain.setValueAtTime(0, ctx.currentTime);
      }
    }
  }, [radioActive, radioVol, masterMute, currentLocation]);

  // Frequency adjustments based on region
  function locationFreqMultiplier(loc, base) {
    if (loc === 'Lagos') return base * 2.2; // High pitch urban noise
    if (loc === 'Ibadan') return base * 1.5;
    if (loc === 'Kwara') return base * 0.9;
    return base;
  }

  function locationRadioFreq(loc) {
    if (loc === 'Lagos') return 220; // A3 Highlife
    if (loc === 'Ibadan') return 196; // G3
    if (loc === 'Kwara') return 164.81; // E3
    return 220;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Audio Engine Button */}
      <button
        onClick={() => {
          ensureAudioContext();
          setIsOpen(!isOpen);
        }}
        className="bg-hustle-card border border-gray-800 text-hustle-gold p-3.5 rounded-full shadow-2xl hover:scale-105 transition flex items-center justify-center gap-2"
        title="Regional Sound Engine"
      >
        {masterMute ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-hustle-green" />}
        <span className="text-xs font-bold font-mono uppercase pr-1 text-white hidden sm:inline">
          {currentLocation} Soundscape
        </span>
      </button>

      {/* Expanded Sound Control Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-hustle-card border border-gray-800 rounded-2xl p-5 w-80 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-150">
          
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sliders className="w-4 h-4 text-hustle-green" />
              <span>Ambient Sound Engine</span>
            </div>
            <button
              onClick={() => setMasterMute(!masterMute)}
              className={`text-xs px-2.5 py-1 rounded font-bold transition ${
                masterMute ? 'bg-red-950 text-red-300' : 'bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              {masterMute ? 'Muted' : 'Mute All'}
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. Highway Traffic Channel */}
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-hustle-gold" /> Expressway Traffic
                </span>
                <input
                  type="checkbox"
                  checked={trafficActive}
                  onChange={(e) => setTrafficActive(e.target.checked)}
                  className="accent-hustle-green cursor-pointer"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!trafficActive}
                value={trafficVol}
                onChange={(e) => setTrafficVol(parseFloat(e.target.value))}
                className="w-full accent-hustle-green cursor-pointer disabled:opacity-30"
              />
            </div>

            {/* 2. Market Ambiance Channel */}
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-hustle-green" /> Market Crowd
                </span>
                <input
                  type="checkbox"
                  checked={marketActive}
                  onChange={(e) => setMarketActive(e.target.checked)}
                  className="accent-hustle-green cursor-pointer"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!marketActive}
                value={marketVol}
                onChange={(e) => setMarketVol(parseFloat(e.target.value))}
                className="w-full accent-hustle-green cursor-pointer disabled:opacity-30"
              />
            </div>

            {/* 3. Regional FM Radio Channel */}
            <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-400" /> {currentLocation} Radio FM
                </span>
                <input
                  type="checkbox"
                  checked={radioActive}
                  onChange={(e) => setRadioActive(e.target.checked)}
                  className="accent-hustle-green cursor-pointer"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!radioActive}
                value={radioVol}
                onChange={(e) => setRadioVol(parseFloat(e.target.value))}
                className="w-full accent-hustle-green cursor-pointer disabled:opacity-30"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center font-mono">
            Location Profile: <span className="text-hustle-gold">{currentLocation}</span>
          </div>

        </div>
      )}
    </div>
  );
}