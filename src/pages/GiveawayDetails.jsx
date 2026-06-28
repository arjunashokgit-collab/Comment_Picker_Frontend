import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  deleteGiveawayAPI,
  getAPIErrorMessage,
  getGiveawayByIdAPI,
  getInstagramCommentsAPI,
  addWinnerAPI,
  getWinnersAPI,
} from '../services/allAPI';
import { mediaConfig } from '../utils/media';

const formatDate = (date) => {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};

const formatSelectedDate = (dateString) => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const defaultRules = {
  winnersCount: 1,
  substitutesCount: 0,
  minTags: 0,
  uniqueUsers: true,
  avoidDuplicateTags: false,
  mustIncludePhrase: false,
  phraseText: '',
  mustFollowList: '',
  requireProfilePic: false,
  requireBio: false,
  minFollowers: 0,
  minPosts: 0,
  entryType: 'comments',
};

const confettiStyle = `
@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(105vh) rotate(720deg);
    opacity: 0;
  }
}
@keyframes confetti-spin-left {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}
@keyframes confetti-spin-right {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const Confetti = () => {
  const colors = ['bg-pink-500', 'bg-violet-500', 'bg-indigo-500', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-rose-400'];
  const [particles] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 2 + Math.random() * 2.5,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      spin: Math.random() > 0.5 ? 'animate-confetti-spin-left' : 'animate-confetti-spin-right',
      opacity: 0.8 + Math.random() * 0.2,
    }))
  );
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <style dangerouslySetInnerHTML={{ __html: confettiStyle }} />
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-sm ${p.color} ${p.spin}`}
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

const GiveawayDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Load rules from router state if available, otherwise fall back to defaults
  const rules = location.state?.rules || defaultRules;
  const selectedPost = location.state?.instagramPost || null;

  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [commentsLoading, setCommentsLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [commentsError, setCommentsError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsPresetWinner, setCommentsPresetWinner] = useState(null);
  
  // Simulated Loading Progress (for Simpliers style loading effect)
  const [simulatedLoading, setSimulatedLoading] = useState(true);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedStatus, setSimulatedStatus] = useState('Connecting to Instagram server...');

  // Live Match Winner/Prediction Word Filter (Dummy UI logic)
  const [predictionWord, setPredictionWord] = useState('');

  // Draw State
  const [winner, setWinner] = useState(null);
  const [winnersList, setWinnersList] = useState([]);
  const [winnerError, setWinnerError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [spinnerName, setSpinnerName] = useState('');

  // 1. Fetch Giveaway from database
  useEffect(() => {
    const fetchGiveaway = async () => {
      if (!id) {
        setError('No giveaway ID was provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getGiveawayByIdAPI(id);
        const fetchedGiveaway = response.data?.data?.giveaway || null;
        setGiveaway(fetchedGiveaway);
        if (fetchedGiveaway && fetchedGiveaway.winners) {
          setWinnersList(fetchedGiveaway.winners);
        }
      } catch (err) {
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          setError(getAPIErrorMessage(err, 'Failed to fetch giveaway.'));
          setCommentsLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchWinners = async () => {
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        try {
          const response = await getWinnersAPI(id);
          setWinnersList(response.data?.winners || []);
        } catch (err) {
          console.error('Failed to fetch winners:', err);
        }
      }
    };

    fetchGiveaway();
    fetchWinners();
  }, [id]);

  // 2. Fetch comments from backend mock API
  useEffect(() => {
    const fetchInstagramComments = async () => {
      if (!id) {
        setCommentsLoading(false);
        return;
      }

      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
      let mediaIdToFetch = isMongoId ? (giveaway ? giveaway.instagramMediaId : null) : id;

      if (isMongoId && !giveaway) {
        return; // wait until giveaway details are loaded
      }

      if (!mediaIdToFetch) {
        mediaIdToFetch = 'itsmebinsabu_post_1'; // default profile post fallback
      }

      setCommentsLoading(true);
      setSimulatedProgress(0);
      setSimulatedLoading(true);
      setCommentsError('');
      setWinner(null);

      try {
        const response = await getInstagramCommentsAPI(mediaIdToFetch);
        const fetchedComments = response.data?.data?.comments || [];
        const presetWinner = response.data?.data?.presetWinner || null;
        setComments(fetchedComments);
        setCommentsPresetWinner(presetWinner);
        if (fetchedComments.length === 0) {
          setSimulatedLoading(false);
        }
      } catch (err) {
        setCommentsError(getAPIErrorMessage(err, 'Failed to fetch comments.'));
        setSimulatedLoading(false);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchInstagramComments();
  }, [id, giveaway]);

  // 3. Simulated Simpliers Fetching Progress Animation
  useEffect(() => {
    if (commentsLoading || !simulatedLoading || comments.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setSimulatedLoading(false), 500);
          return 100;
        }
        
        // Update status text dynamically
        if (next < 25) {
          setSimulatedStatus('Connecting to Instagram...');
        } else if (next < 50) {
          setSimulatedStatus(`Fetching entries (retrieved ${comments.length} comments)...`);
        } else if (next < 75) {
          setSimulatedStatus('Verifying custom giveaway rules...');
        } else {
          setSimulatedStatus('Confirming qualified usernames...');
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [commentsLoading, simulatedLoading, comments.length]);

  // 4. Apply rules to comments to get the list of eligible comments
  const filteredComments = useMemo(() => {
    if (comments.length === 0) return [];

    let result = [...comments];

    const checkIfPreset = (username) => {
      return (
        username === commentsPresetWinner?.username ||
        (mediaConfig.user_id1 && username === mediaConfig.user_id1.trim()) ||
        (mediaConfig.user_id2 && username === mediaConfig.user_id2.trim()) ||
        (mediaConfig.user_id3 && username === mediaConfig.user_id3.trim())
      );
    };

    // Live Prediction Word Filter (Dynamic UI Demo Mode)
    if (predictionWord.trim()) {
      const term = predictionWord.trim().toLowerCase();
      result = result.filter((comment) => {
        const isPreset = checkIfPreset(comment.username);
        if (isPreset) {
          // Dynamically ensure preset winner comment matches prediction term so it isn't filtered out
          if (!comment.text.toLowerCase().includes(term)) {
            comment.text = `${comment.text} (Prediction: ${predictionWord.trim()})`;
          }
          return true;
        }
        return comment.text?.toLowerCase().includes(term);
      });
    }

    // Rules: Get Unique Users (Filter duplicate comments by username)
    if (rules.uniqueUsers) {
      const seenUsernames = new Set();
      result = result.filter((comment) => {
        // Always retain preset winner in list to avoid filter exclusion
        if (checkIfPreset(comment.username)) return true;
        
        if (seenUsernames.has(comment.username)) {
          return false;
        }
        seenUsernames.add(comment.username);
        return true;
      });
    }

    // Rules: Must Include Phrase
    if (rules.mustIncludePhrase && rules.phraseText) {
      const phrase = rules.phraseText.trim().toLowerCase();
      result = result.filter((comment) => {
        // Always retain preset winner
        if (checkIfPreset(comment.username)) return true;

        return comment.text?.toLowerCase().includes(phrase);
      });
    }

    // Rules: Minimum Tags Count
    if (rules.minTags > 0) {
      result = result.filter((comment) => {
        // Always retain preset winner
        if (checkIfPreset(comment.username)) return true;

        // Tags are identified by '@username'
        const tagsCount = (comment.text?.match(/@[a-zA-Z0-9._]+/g) || []).length;
        return tagsCount >= rules.minTags;
      });
    }

    return result;
  }, [comments, rules, commentsPresetWinner, predictionWord]);

  const displayEligibleCount = useMemo(() => {
    if (comments.length === 0) return 0;
    if (filteredComments.length === 0) return 0;
    if (predictionWord.trim()) {
      const uniqueCommentsCount = rules.uniqueUsers 
        ? new Set(comments.map(c => c.username)).size 
        : comments.length;
      const ratio = filteredComments.length / uniqueCommentsCount;
      return Math.round(45657 * ratio);
    }
    return 45657;
  }, [filteredComments.length, comments, predictionWord, rules.uniqueUsers]);

  const handleDelete = async () => {
    if (!giveaway?._id) return;
    try {
      await deleteGiveawayAPI(giveaway._id);
      navigate('/dashboard');
    } catch (err) {
      setError(getAPIErrorMessage(err, 'Failed to delete giveaway.'));
    }
  };

  // 5. Draw Winner Logic (Simpliers Slot-Machine Style Spinner)
  const handlePickWinner = async () => {
    if (filteredComments.length === 0 || isDrawing) return;

    setWinnerError('');
    setIsDrawing(true);
    setWinner(null);

    // Determine target winner (Use Preset/Rigged winner if configured and not drawn yet)
    let targetWinner = null;
    const drawnWinnersCount = winnersList.length;

    let targetUsername = null;
    let seededWinnerComment = '';

    if (drawnWinnersCount === 0 && mediaConfig.user_id1) {
      targetUsername = mediaConfig.user_id1.trim();
      seededWinnerComment = mediaConfig.comment1 || 'Amazing! I won the first round! 🎉🎁';
    } else if (drawnWinnersCount === 1 && mediaConfig.user_id2) {
      targetUsername = mediaConfig.user_id2.trim();
      seededWinnerComment = mediaConfig.comment2 || 'Wow, I am the second winner! Thank you so much! 😍✨';
    } else if (drawnWinnersCount === 2 && mediaConfig.user_id3) {
      targetUsername = mediaConfig.user_id3.trim();
      seededWinnerComment = mediaConfig.comment3 || 'Third time is a charm! Super excited! 🍀🙌';
    }

    if (targetUsername) {
      // Find preset in comments or build structure
      const existingComment = filteredComments.find((c) => c.username === targetUsername);
      targetWinner = {
        id: existingComment?.id || `comment_preset_${targetUsername}`,
        username: targetUsername,
        text: seededWinnerComment,
        timestamp: existingComment?.timestamp || new Date().toISOString(),
        likeCount: existingComment?.likeCount || 12,
      };
      
      // Ensure the displayed winner object reflects the dynamically updated text with prediction word if active
      if (predictionWord.trim()) {
        const term = predictionWord.trim().toLowerCase();
        if (!targetWinner.text.toLowerCase().includes(term)) {
          targetWinner.text = `${targetWinner.text} (Prediction: ${predictionWord.trim()})`;
        }
      }
    } else {
      // Fallback: If not part of the first 3 rigged drawings, fall back to backend's commentsPresetWinner if not drawn yet
      const preset = commentsPresetWinner;
      const hasPresetBeenDrawn = preset && winnersList.some((w) => w.username === preset.username);
      
      if (preset && !hasPresetBeenDrawn) {
        targetWinner = filteredComments.find((c) => c.username === preset.username) || {
          username: preset.username,
          text: preset.text,
        };
        if (predictionWord.trim()) {
          const term = predictionWord.trim().toLowerCase();
          if (!targetWinner.text.toLowerCase().includes(term)) {
            targetWinner.text = `${targetWinner.text} (Prediction: ${predictionWord.trim()})`;
          }
        }
      } else {
        // Draw a random winner from comments that haven't won yet
        const alreadyWonUsernames = new Set(winnersList.map((w) => w.username));
        const remainingComments = filteredComments.filter((c) => !alreadyWonUsernames.has(c.username));
        
        if (remainingComments.length > 0) {
          targetWinner = remainingComments[Math.floor(Math.random() * remainingComments.length)];
        } else {
          targetWinner = filteredComments[Math.floor(Math.random() * filteredComments.length)];
        }
      }
    }

    // Name Spinner Animation parameters
    const animUsernames = filteredComments.map((c) => c.username);
    let counter = 0;
    let delay = 50; // ms

    const spin = () => {
      setSpinnerName(animUsernames[Math.floor(Math.random() * animUsernames.length)] || 'scanning...');
      counter += 1;

      // Adjust animation speed dynamically
      if (counter > 30) delay = 100;
      if (counter > 40) delay = 220;
      if (counter > 45) delay = 450;

      if (counter >= 50) {
        // Animation finished! Land on target winner
        setSpinnerName(targetWinner.username);
        
        setTimeout(async () => {
          setWinner(targetWinner);
          setIsDrawing(false);
          
          // Save winner in database
          if (giveaway?._id) {
            try {
              const response = await addWinnerAPI(giveaway._id, {
                commentId: targetWinner.id || 'winner_id',
                username: targetWinner.username || 'Unknown user',
                commentText: targetWinner.text || 'No comment text',
              });
              if (response.data?.success) {
                setWinnersList(response.data.winners || []);
              }
            } catch (err) {
              console.error('Error saving winner:', err);
              setWinnerError(getAPIErrorMessage(err, 'Failed to save winner to database.'));
            }
          } else {
            // Fallback for mock drawings without database active IDs
            setWinnersList((prev) => [
              ...prev,
              {
                commentId: targetWinner.id || 'winner_id',
                username: targetWinner.username,
                commentText: targetWinner.text,
                selectedAt: new Date().toISOString(),
              },
            ]);
          }
        }, 600);
      } else {
        setTimeout(spin, delay);
      }
    };

    setTimeout(spin, delay);
  };

  return (
    <div className="min-h-screen bg-[#070714] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-300 hover:text-violet-200 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
          {giveaway?._id && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition-all"
            >
              Delete Records
            </button>
          )}
        </div>

        {/* 1. Page Main Loading details */}
        {loading ? (
          <div className="rounded-2xl border border-slate-855 bg-[#0f0f23]/60 p-12 text-center text-slate-400 backdrop-blur-sm">
            Loading giveaway details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header info card */}
            <section className="rounded-2xl border border-violet-900/20 bg-gradient-to-br from-[#0e0e24]/90 to-[#0b0b1c]/90 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-28 w-28 bg-violet-600/10 blur-2xl rounded-full" />
              
              <div className="grid gap-6 md:grid-cols-[1fr_380px] items-center">
                <div>
                  <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 uppercase tracking-widest">
                    {giveaway?.platform || 'Instagram'} • {rules.entryType === 'likes' ? 'Likes Draw' : 'Comments Draw'}
                  </span>
                  <h1 className="mt-2.5 text-2xl font-black text-white sm:text-3xl">
                    {giveaway?.title || selectedPost?.caption?.split('\n')[0] || 'Instagram Giveaway'}
                  </h1>
                  
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400">
                    <span className="break-all font-mono">
                      URL: <a href={giveaway?.postUrl || selectedPost?.permalink} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">{giveaway?.postUrl || selectedPost?.permalink}</a>
                    </span>
                    <span className="hidden sm:inline text-slate-600">•</span>
                    <span>Created: {formatDate(giveaway?.createdAt || selectedPost?.timestamp)}</span>
                  </div>
                </div>

                {/* Media Preview Card with play button overlay */}
                <div className="rounded-xl border border-slate-800 bg-[#12122b]/80 p-3.5 flex gap-4 items-center shadow-md">
                  <div className="h-16 w-16 bg-slate-900 rounded-lg overflow-hidden relative shrink-0 border border-slate-700">
                    <img
                      src={mediaConfig?.image || selectedPost?.thumbnailUrl || selectedPost?.mediaUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=850&auto=format&fit=crop&q=80'}
                      alt="Instagram media preview"
                      className="h-full w-full object-cover"
                    />
                    
                    {/* Centered play icon for video representation */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <div className="h-6 w-6 rounded-full bg-white/20 border border-white/35 flex items-center justify-center text-white backdrop-blur-sm">
                        <svg className="h-2.5 w-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 overflow-hidden flex-1">
                    <p className="text-[11px] font-bold text-violet-300">
                      @{selectedPost?.username || 'itsmebinsabu'}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {selectedPost?.caption || giveaway?.title || 'Loading content...'}
                    </p>
                    <div className="flex gap-3 text-[9px] text-slate-500">
                      <span>🎬 Video post</span>
                      <span>❤️ {selectedPost?.likeCount || 1540} likes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules summary block */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/60 pt-4">
                <div className="rounded-xl bg-[#111129] p-3 border border-slate-850">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Winners Selected</p>
                  <p className="mt-1 text-sm font-extrabold text-white">{winnersList.length} / {rules.winnersCount}</p>
                </div>
                <div className="rounded-xl bg-[#111129] p-3 border border-slate-850">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Unique Users Filter</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-400">{rules.uniqueUsers ? 'ACTIVE' : 'INACTIVE'}</p>
                </div>
                <div className="rounded-xl bg-[#111129] p-3 border border-slate-850">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Min Tags Rule</p>
                  <p className="mt-1 text-sm font-extrabold text-white">{rules.minTags > 0 ? `${rules.minTags} tags` : 'None'}</p>
                </div>
                <div className="rounded-xl bg-[#111129] p-3 border border-slate-850">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Phrase Check</p>
                  <p className="mt-1 text-sm font-extrabold truncate text-white" title={rules.phraseText}>
                    {rules.mustIncludePhrase ? `"${rules.phraseText}"` : 'None'}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Simulated Loader Progress Card (Simpliers UI) */}
            {simulatedLoading ? (
              <section className="rounded-2xl border border-violet-500/20 bg-[#0e0e24] p-8 shadow-xl text-center backdrop-blur-md">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>{simulatedStatus}</span>
                    <span className="text-violet-300 font-mono">{simulatedProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-150 ease-out"
                      style={{ width: `${simulatedProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    Retrieving eligible items...
                  </p>
                </div>
              </section>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                
                {/* Ticker / Drawing slot card */}
                <div className="space-y-6">
                  
                  {/* Match Prediction Word Filter Card */}
                  <section className="rounded-2xl border border-violet-900/30 bg-[#0e0e24] p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
                        <span>🏆</span> Match Winner / Prediction Filter
                      </h3>
                      <span className="text-[9px] bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                        Live Draw Filter
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400">
                        Enter Winning Prediction Word (e.g. Team A, Team B)
                      </label>
                      <input
                        type="text"
                        placeholder="Type winning prediction (e.g. Team A) to filter comments..."
                        value={predictionWord}
                        onChange={(e) => {
                          setPredictionWord(e.target.value);
                          // Reset current winner display when filtering changes
                          setWinner(null);
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-[#161633] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        Only comments containing this word (case-insensitive) will be eligible to win the giveaway.
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-violet-900/30 bg-[#0e0e24] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-600/5 via-transparent to-transparent pointer-events-none" />
                    
                    {isDrawing ? (
                      <div className="space-y-6 text-center w-full max-w-sm">
                        <div className="flex justify-center items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Drawing Winner...</span>
                        </div>
                        {/* Name display box */}
                        <div className="w-full h-24 rounded-2xl border-2 border-violet-500 bg-[#070714] shadow-lg shadow-violet-500/10 flex items-center justify-center font-mono overflow-hidden">
                          <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300 animate-pulse block truncate w-full min-w-0 px-4 text-center">
                            @{spinnerName}
                          </span>
                        </div>
                        {/* Simulated audio-visualizer bars */}
                        <div className="flex justify-center gap-1 h-6">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                            <span
                              key={item}
                              className="w-1 bg-violet-500/80 rounded-full animate-bounce"
                              style={{
                                animationDelay: `${item * 0.1}s`,
                                animationDuration: '0.6s'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : winner ? (
                      /* 3. Validity Winner Certificate Card */
                      <div className="w-full max-w-lg p-6 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-[#181816]/95 to-[#10100d]/95 relative shadow-2xl text-center space-y-6 transform scale-100 transition-all duration-500">
                        <Confetti />
                        
                        {/* Decorative Gold Stars */}
                        <div className="flex justify-center text-amber-400 text-xl gap-1">
                          <span>★</span><span>★</span><span>🏆</span><span>★</span><span>★</span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Giveaway Draw Certificate
                          </p>
                          <h2 className="text-2xl font-black text-white">OFFICIAL WINNER DRAWN</h2>
                        </div>

                        {/* Winner Username Box */}
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 py-5 px-4 overflow-hidden">
                          <span className="block text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 truncate w-full min-w-0 px-2 text-center">
                            @{winner.username}
                          </span>
                          <p className="mt-3 text-xs italic text-slate-300 px-4 max-w-sm mx-auto break-words">
                            "{winner.text || winner.commentText}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-4 px-2 font-mono">
                          <span>VERIFIED BY CommentPicker DRAW</span>
                          <span>{new Date().toLocaleDateString('en-IN')}</span>
                        </div>

                        {winnerError && (
                          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300">
                            {winnerError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handlePickWinner}
                            disabled={filteredComments.length <= 1}
                            className="flex-1 py-2.5 rounded-xl border border-amber-400/30 text-amber-300 hover:bg-amber-400/10 text-xs font-bold transition-all"
                          >
                            Draw Another Winner
                          </button>
                          <button
                            type="button"
                            onClick={() => setWinner(null)}
                            className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition-all"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto text-3xl">
                          ⚙️
                        </div>
                        <h3 className="text-lg font-bold">Ready to select the winner!</h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          {predictionWord.trim() 
                            ? `Only comments containing "${predictionWord.trim()}" are eligible.` 
                            : 'Click start draw to trigger the spinning animation and select the configured winner.'}
                        </p>
                        <button
                          type="button"
                          onClick={handlePickWinner}
                          disabled={filteredComments.length === 0}
                          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🎉 START DRAW NOW
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Comments list display */}
                  <section className="rounded-2xl border border-slate-855 bg-[#0e0e24]/60 overflow-hidden shadow-lg">
                    <div className="px-5 py-4 border-b border-slate-855 flex justify-between items-center bg-[#0a0a1a]/40">
                      <div>
                        <h3 className="text-sm font-bold">Eligible Comments ({displayEligibleCount.toLocaleString()})</h3>
                        <p className="text-[10px] text-slate-500">After applying rules and prediction word filters</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Total: {comments.length}
                      </span>
                    </div>

                    {commentsError ? (
                      <div className="p-8 text-center text-rose-400 text-xs font-semibold bg-rose-500/5">
                        Error loading comments: {commentsError}
                      </div>
                    ) : filteredComments.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No comments match the filters. Try adjusting rules or entering a different prediction word.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-855/60 p-4 space-y-3">
                        {filteredComments.map((comment, index) => {
                          const isPreset = comment.username === commentsPresetWinner?.username;
                          return (
                            <article
                              key={comment.id || index}
                              className={`p-3.5 rounded-xl transition-all ${
                                isPreset
                                  ? 'border border-amber-400/25 bg-amber-400/5'
                                  : 'border border-slate-855 bg-[#14142f]/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-bold ${isPreset ? 'text-amber-300' : 'text-slate-200'}`}>
                                  @{comment.username}
                                  {isPreset && (
                                    <span className="ml-2 text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded font-mono font-bold">
                                      CONFIGURED WINNER
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-500">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed break-all">
                                {comment.text}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* Sidebar winner history list */}
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-850 bg-[#0e0e24] p-5 shadow-lg space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                      <span className="text-lg">🏆</span>
                      <h3 className="text-sm font-bold">Winner History</h3>
                    </div>

                    {winnersList.length === 0 ? (
                      <div className="rounded-xl border border-slate-855 bg-[#070714] p-4 text-center text-slate-500 text-xs">
                        No winners drawn yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {winnersList.map((w, idx) => (
                          <div
                            key={w.commentId || idx}
                            className="p-3 rounded-xl border border-violet-500/15 bg-violet-600/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-amber-300">
                                #{idx + 1} @{w.username}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {formatSelectedDate(w.selectedAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              "{w.commentText}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
                
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
};

export default GiveawayDetails;
