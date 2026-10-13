import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Vote, Award, CheckCircle2, UserPlus, AlertCircle, 
  Crown, Megaphone, DollarSign, Users, ShieldCheck, Flame 
} from 'lucide-react';

export default function UnionElection({ player, onPlayerUpdate }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Candidate Registration Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [manifesto, setManifesto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/elections');
      setElections(res.data.elections || []);
      if (res.data.elections?.length > 0) {
        setSelectedElection(res.data.elections[0]);
      }
    } catch (err) {
      console.error('Failed to load union elections:', err);
      setMessage({ type: 'error', text: 'Could not load election cycles.' });
    } finally {
      setLoading(false);
    }
  };

  // Check if player has already voted in the active selected election
  const hasVoted = selectedElection?.voters?.includes(player?._id);

  // Check if player is running as a candidate in the selected election
  const isCandidate = selectedElection?.candidates?.some(
    (c) => (c.player?._id || c.player) === player?._id
  );

  // Handle Candidate Registration
  const handleRegisterCandidate = async (e) => {
    e.preventDefault();
    if (!selectedElection) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/elections/register', {
        electionId: selectedElection._id,
        manifesto: manifesto.trim()
      });

      setMessage({ type: 'success', text: res.data.message });

      if (onPlayerUpdate && res.data.remainingCash !== undefined) {
        onPlayerUpdate({ cash: res.data.remainingCash });
      }

      setShowRegModal(false);
      setManifesto('');
      fetchElections(); // Refresh roster
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Candidate registration failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Casting a Vote
  const handleCastVote = async (candidatePlayerId) => {
    if (!selectedElection) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/elections/vote', {
        electionId: selectedElection._id,
        candidatePlayerId
      });

      setMessage({ type: 'success', text: res.data.message });
      fetchElections(); // Refresh vote count
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit vote'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-hustle-card p-12 rounded-xl border border-gray-800 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-hustle-green border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-mono">Fetching active union ballots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Status Header */}
      <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Vote className="text-hustle-green" /> Regional Union & Guild Elections
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Elect Union Chairmen across Southwestern corridors to dictate regional transport levies and warehouse tariffs.
          </p>
        </div>

        {/* Region Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {elections.map((elec) => {
            const isSelected = selectedElection?._id === elec._id;
            return (
              <button
                key={elec._id}
                onClick={() => {
                  setSelectedElection(elec);
                  setMessage(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-hustle-green text-white shadow-lg'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span>{elec.region}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                  elec.status === 'VOTING' 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : elec.status === 'REGISTRATION' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {elec.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Banner */}
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

      {selectedElection ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Candidates Roster */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-hustle-card p-6 rounded-xl border border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="text-hustle-gold" /> {selectedElection.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    Region: <span className="text-hustle-green">{selectedElection.region}</span> • Total Votes Cast: {selectedElection.voters?.length || 0}
                  </p>
                </div>

                {/* Status Specific Badges */}
                {selectedElection.status === 'REGISTRATION' && (
                  <button
                    disabled={isCandidate}
                    onClick={() => setShowRegModal(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isCandidate
                        ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-hustle-gold hover:bg-amber-600 text-black shadow-md'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isCandidate ? 'Candidacy Filed' : 'Run for Chairman'}</span>
                  </button>
                )}
              </div>

              {/* Candidates Grid */}
              <div className="space-y-4">
                {!selectedElection.candidates || selectedElection.candidates.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    No candidates have registered for the <span className="text-white font-semibold">{selectedElection.region}</span> Union Chairman seat yet. Be the first to apply!
                  </div>
                ) : (
                  selectedElection.candidates.map((cand, idx) => {
                    const candidatePlayer = cand.player;
                    const candidateName = candidatePlayer?.username || 'Unknown Trader';
                    const voteCount = cand.votes || 0;
                    const totalVotes = selectedElection.voters?.length || 1;
                    const percentage = Math.round((voteCount / totalVotes) * 100);

                    const isWinner = selectedElection.status === 'CLOSED' && 
                      (selectedElection.winner?._id || selectedElection.winner) === (candidatePlayer?._id || candidatePlayer);

                    return (
                      <div
                        key={cand._id || idx}
                        className={`p-5 rounded-xl border transition relative overflow-hidden ${
                          isWinner
                            ? 'bg-amber-950/20 border-hustle-gold'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {isWinner && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-hustle-gold text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                            <Crown className="w-3 h-3" /> Elected Chairman
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-base">{candidateName}</span>
                              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                                Trades: {candidatePlayer?.totalTradesCompleted || 0}
                              </span>
                            </div>

                            {/* Manifesto */}
                            <p className="text-xs text-gray-300 italic bg-gray-800/60 p-3 rounded-lg border border-gray-800">
                              "{cand.manifesto}"
                            </p>
                          </div>

                          {/* Vote Action & Stats */}
                          <div className="flex items-center gap-4 shrink-0 sm:text-right">
                            <div>
                              <div className="text-lg font-mono font-black text-hustle-gold">
                                {voteCount} <span className="text-xs font-normal text-gray-400">votes ({percentage}%)</span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-28 bg-gray-800 h-2 rounded-full overflow-hidden mt-1 border border-gray-700">
                                <div
                                  style={{ width: `${percentage}%` }}
                                  className="bg-hustle-gold h-full rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>

                            {/* Vote Button */}
                            {selectedElection.status === 'VOTING' && (
                              <button
                                disabled={hasVoted || isSubmitting}
                                onClick={() => handleCastVote(candidatePlayer?._id || candidatePlayer)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                  hasVoted
                                    ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-hustle-green hover:bg-green-700 text-white shadow-md'
                                }`}
                              >
                                <Vote className="w-4 h-4" />
                                <span>{hasVoted ? 'Vote Cast' : 'Vote'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info & Election Status */}
          <div className="space-y-6">
            
            {/* Election Rules Card */}
            <div className="bg-hustle-card p-6 rounded-xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldCheck className="text-hustle-green" /> Guild Election Terms
              </h3>

              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">Current Phase:</span>
                  <span className="font-bold text-hustle-gold uppercase font-mono">{selectedElection.status}</span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">Registration Fee:</span>
                  <span className="font-bold text-white font-mono">₦{selectedElection.registrationFee?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between pb-2 border-b border-gray-800">
                  <span className="text-gray-400">Voting Power:</span>
                  <span className="font-bold text-white font-mono">1 Vote / Registered Trader</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-900 border border-gray-800 rounded-xl text-[11px] text-gray-400 space-y-1">
                <span className="font-bold text-white block">💡 Chairman Perks:</span>
                Elected Union Chairmen earn 5% dividends on all interstate tolls collected inside their assigned region.
              </div>
            </div>

            {/* Active Chairman Display */}
            {selectedElection.winner && (
              <div className="bg-amber-950/20 border border-hustle-gold/50 p-6 rounded-xl text-center space-y-2">
                <Crown className="w-8 h-8 text-hustle-gold mx-auto" />
                <h4 className="text-xs uppercase font-bold text-gray-400">Incumbent Chairman</h4>
                <div className="text-xl font-black text-white">
                  {selectedElection.winner?.username || 'Elected Leader'}
                </div>
                <p className="text-[11px] text-hustle-gold font-mono">
                  Presiding Officer • {selectedElection.region} Union
                </p>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="bg-hustle-card p-12 rounded-xl border border-gray-800 text-center text-gray-500 text-xs">
          No election cycles configured.
        </div>
      )}

      {/* CANDIDATE REGISTRATION MODAL */}
      {showRegModal && selectedElection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hustle-card border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Megaphone className="text-hustle-gold" /> File Candidacy for Chairman
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Run for political office in the <span className="text-white font-semibold">{selectedElection.region}</span> Union.
            </p>

            <form onSubmit={handleRegisterCandidate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-2">
                  Campaign Manifesto (Max 280 characters)
                </label>
                <textarea
                  rows="3"
                  maxLength="280"
                  required
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="State your campaign promises to fellow traders (e.g., Lowering warehouse tariffs)..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hustle-green"
                />
              </div>

              <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase">Filing Fee:</span>
                <span className="font-mono font-black text-hustle-gold text-sm">
                  ₦{selectedElection.registrationFee?.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || player?.cash < selectedElection.registrationFee}
                  className="w-1/2 py-2.5 rounded-xl bg-hustle-gold hover:bg-amber-600 text-black font-bold text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Filing Application...' : 'Confirm & Pay Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}