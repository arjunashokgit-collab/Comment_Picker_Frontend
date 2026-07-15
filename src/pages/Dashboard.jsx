import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GiveawayCard from '../components/GiveawayCard';
import Navbar from '../components/Navbar';
import { mediaConfig } from '../utils/media';
import {
  createGiveawayAPI,
  deleteGiveawayAPI,
  getAllGiveawaysAPI,
  getAPIErrorMessage,
  getInstagramPostsAPI,
  getInstagramProfileAPI,
} from '../services/allAPI';

// Helper to extract Instagram shortcode/media ID from URL
const extractInstagramShortcode = (url) => {
  if (!url) return '';
  try {
    const match = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: split by slash and take the last part (stripping query parameters)
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || 'custom_post';
  } catch (err) {
    return 'custom_post';
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  // State for giveaways and Instagram data
  const [giveaways, setGiveaways] = useState([]);
  const [instagramProfile, setInstagramProfile] = useState(null);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  
  // Tabs: 'links' or 'rules'
  const [activeTab, setActiveTab] = useState('links');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [instagramLoading, setInstagramLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [instagramError, setInstagramError] = useState('');
  const [search, setSearch] = useState('');

  // Simpliers Giveaway Rules Form State
  const [contestName, setContestName] = useState('Brazil vs Norway aruu jaikum???');
  const [postUrl, setPostUrl] = useState('');
  const [entryType, setEntryType] = useState('comments'); // 'comments' or 'likes'
  const [winnersCount, setWinnersCount] = useState(1);
  const [substitutesCount, setSubstitutesCount] = useState(0);
  const [minTags, setMinTags] = useState(0);
  
  // Filters & Toggles
  const [uniqueUsers, setUniqueUsers] = useState(true);
  const [avoidDuplicateTags, setAvoidDuplicateTags] = useState(false);
  const [mustIncludePhrase, setMustIncludePhrase] = useState(false);
  const [phraseText, setPhraseText] = useState('');
  
  // Advanced Rules Collapsible
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mustFollowList, setMustFollowList] = useState('');
  const [requireProfilePic, setRequireProfilePic] = useState(false);
  const [requireBio, setRequireBio] = useState(false);
  const [minFollowers, setMinFollowers] = useState(0);
  const [minPosts, setMinPosts] = useState(0);

  // Search filter for previous giveaways
  const filteredGiveaways = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return giveaways;
    return giveaways.filter((giveaway) => {
      return (
        giveaway.title?.toLowerCase().includes(keyword) ||
        giveaway.platform?.toLowerCase().includes(keyword) ||
        giveaway.postUrl?.toLowerCase().includes(keyword)
      );
    });
  }, [giveaways, search]);

  const fetchGiveaways = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllGiveawaysAPI();
      setGiveaways(response.data?.data?.giveaways || []);
    } catch (err) {
      setError(getAPIErrorMessage(err, 'Failed to fetch giveaways.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramData = async () => {
    setInstagramLoading(true);
    setInstagramError('');
    try {
      const [profileResult, postsResult] = await Promise.allSettled([
        getInstagramProfileAPI(),
        getInstagramPostsAPI(),
      ]);

      if (profileResult.status === 'fulfilled') {
        setInstagramProfile(profileResult.value.data?.data?.profile || null);
      }
      if (postsResult.status === 'fulfilled') {
        setInstagramPosts(postsResult.value.data?.data?.posts || []);
      }
    } catch (err) {
      setInstagramError(getAPIErrorMessage(err, 'Failed to fetch Instagram data.'));
    } finally {
      setInstagramLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
    fetchInstagramData();
  }, []);

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    setPostUrl(post.permalink || '');
    setContestName(
      post.caption
        ? post.caption.split('\n')[0].substring(0, 45) + (post.caption.length > 45 ? '...' : '')
        : 'Instagram Giveaway'
    );
    // Auto switch to Rules tab so user can check rules easily
    setActiveTab('rules');
    // Scroll to the main configuration card
    const configSection = document.getElementById('config-card');
    if (configSection) {
      configSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateAndDraw = async (e) => {
    if (e) e.preventDefault();
    if (!postUrl.trim()) {
      setError('Please paste or select an Instagram post URL.');
      setActiveTab('links');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Extract shortcode/mediaId from URL
      const mediaId = extractInstagramShortcode(postUrl) || selectedPostId || 'itsmebinsabu_post_1';

      // Find matching media ID details from loaded posts if any
      const matched = instagramPosts.find(
        (p) => p.id === mediaId || p.permalink?.toLowerCase().includes(postUrl.toLowerCase()) || postUrl.toLowerCase().includes(p.permalink?.toLowerCase())
      );

      const response = await createGiveawayAPI({
        title: contestName.trim(),
        platform: 'Instagram',
        postUrl: postUrl.trim(),
        instagramMediaId: mediaId,
      });

      const giveaway = response.data?.data?.giveaway;
      
      // Navigate to drawing visualizer page
      navigate(`/giveaway/${giveaway._id || mediaId}`, {
        state: {
          instagramPost: matched || {
            id: mediaId,
            caption: contestName,
            permalink: postUrl,
            timestamp: new Date().toISOString(),
            mediaType: 'VIDEO',
            mediaUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
            commentsCount: mediaConfig.commentsCount !== undefined ? mediaConfig.commentsCount : 22028,
            likeCount: mediaConfig.likeCount !== undefined ? mediaConfig.likeCount : 18927
          },
          selectedPostId: mediaId,
          rules: {
            winnersCount,
            substitutesCount,
            minTags,
            uniqueUsers,
            avoidDuplicateTags,
            mustIncludePhrase,
            phraseText,
            mustFollowList,
            requireProfilePic,
            requireBio,
            minFollowers,
            minPosts,
            entryType,
          },
        },
      });
    } catch (err) {
      setError(getAPIErrorMessage(err, 'Failed to initialize draw.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await deleteGiveawayAPI(id);
      setGiveaways((current) => current.filter((giveaway) => giveaway._id !== id));
    } catch (err) {
      setError(getAPIErrorMessage(err, 'Failed to delete giveaway.'));
    }
  };

  // Helper component for steppers
  const StepperInput = ({ value, onChange, min = 0, max = 100 }) => (
    <div className="flex items-center rounded-xl border border-slate-700 bg-[#1a1a35] p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        -
      </button>
      <span className="w-12 text-center text-sm font-semibold text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        +
      </button>
    </div>
  );

  // Helper component for toggle switches
  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-violet-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#070714] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* Banner info */}
        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-indigo-950/40 backdrop-blur-md">
          <div className="space-y-1.5">
            <span className="inline-flex rounded-full bg-violet-600/20 border border-violet-500/30 px-3 py-1 text-xs font-bold text-violet-300 uppercase tracking-wider">
              Connected Account Setup
            </span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-100 to-indigo-300">
              Free Instagram Giveaway Picker
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Create transparent giveaways just like Simpliers. Run draws with customizable filter options and results from your profile comments.
            </p>
          </div>
          {instagramProfile && (
            <div className="mt-4 md:mt-0 flex items-center gap-3 bg-[#111126] border border-slate-800 p-3 rounded-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-600/10 text-pink-500 font-bold">
                IG
              </div>
              <div>
                <p className="text-xs text-slate-500">Instagram Account</p>
                <p className="text-sm font-extrabold text-white">@{instagramProfile.username}</p>
              </div>
            </div>
          )}
        </section>

        {/* Simpliers Style Configuration Box */}
        <section id="config-card" className="mb-8 rounded-2xl border border-violet-900/30 bg-[#0e0e24] shadow-2xl overflow-hidden">
          
          {/* Tab Navigation header */}
          <div className="flex border-b border-slate-800 bg-[#0a0a1a]/60">
            <button
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'links'
                  ? 'border-violet-500 text-white bg-violet-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🔗 Links & Source
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'rules'
                  ? 'border-violet-500 text-white bg-violet-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚙️ Giveaway Rules
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'links' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-violet-300 mb-2">
                    Paste Link of Your Media
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/reel/C..."
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#161633] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Paste any Instagram post or reel URL, or select from the account posts list below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                      Entry Source
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEntryType('comments')}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                          entryType === 'comments'
                            ? 'border-violet-500 bg-violet-600/10 text-violet-300'
                            : 'border-slate-800 bg-[#161633] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        💬 From Comments
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryType('likes')}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                          entryType === 'likes'
                            ? 'border-violet-500 bg-violet-600/10 text-violet-300'
                            : 'border-slate-800 bg-[#161633] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ❤️ From Likes
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('rules')}
                      className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Configure Giveaway Rules &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAndDraw} className="space-y-6">
                
                {/* Rules controls grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-violet-300 mb-2">
                        Name Of Your Contest
                      </label>
                      <input
                        type="text"
                        placeholder="Summer Giveaway 2026"
                        value={contestName}
                        onChange={(e) => setContestName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-[#161633] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Winners
                        </label>
                        <StepperInput value={winnersCount} onChange={setWinnersCount} min={1} max={10} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Substitutes
                        </label>
                        <StepperInput value={substitutesCount} onChange={setSubstitutesCount} min={0} max={10} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Minimum Tags Count
                      </label>
                      <StepperInput value={minTags} onChange={setMinTags} min={0} max={5} />
                    </div>
                  </div>

                  {/* Filtering switches */}
                  <div className="space-y-4 rounded-xl border border-slate-800/80 bg-[#0c0c20]/60 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-800 pb-2">
                      Rules & Filters
                    </h4>
                    
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-semibold">Get Unique Users</p>
                        <p className="text-xs text-slate-500">Count only one comment per user</p>
                      </div>
                      <ToggleSwitch checked={uniqueUsers} onChange={setUniqueUsers} />
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-semibold">Avoid Duplicate Tags</p>
                        <p className="text-xs text-slate-500">Ignore comments with duplicate friend tags</p>
                      </div>
                      <ToggleSwitch checked={avoidDuplicateTags} onChange={setAvoidDuplicateTags} />
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-semibold">Must Include Phrases</p>
                        <p className="text-xs text-slate-500">Require specific phrase or hashtag</p>
                      </div>
                      <ToggleSwitch checked={mustIncludePhrase} onChange={setMustIncludePhrase} />
                    </div>

                    {mustIncludePhrase && (
                      <input
                        type="text"
                        placeholder="e.g. #giveaway, win"
                        value={phraseText}
                        onChange={(e) => setPhraseText(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#161633] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Collapsible Advanced Rules */}
                <div className="rounded-xl border border-slate-800 bg-[#0b0b1c]/30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors bg-[#0f0f26]/40"
                  >
                    <span>🛠️ Advanced Rules (Collapsible)</span>
                    <span>{showAdvanced ? '▲' : '▼'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="p-4 grid gap-4 md:grid-cols-2 border-t border-slate-800">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">
                            Must Follow Accounts (comma separated)
                          </label>
                          <input
                            type="text"
                            placeholder="@my_store, @sponsor"
                            value={mustFollowList}
                            onChange={(e) => setMustFollowList(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-[#161633] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-slate-400">Must Have Profile Picture</span>
                          <ToggleSwitch checked={requireProfilePic} onChange={setRequireProfilePic} />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-slate-400">Must Have Biography Text</span>
                          <ToggleSwitch checked={requireBio} onChange={setRequireBio} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">
                            Minimum Followers Threshold
                          </label>
                          <StepperInput value={minFollowers} onChange={setMinFollowers} min={0} max={10000} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">
                            Minimum Posts Threshold
                          </label>
                          <StepperInput value={minPosts} onChange={setMinPosts} min={0} max={500} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('links')}
                    className="rounded-xl border border-slate-850 bg-slate-900/50 hover:bg-slate-900 px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-300"
                  >
                    &larr; Back to Link
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-8 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-70 flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : '🚀 GET COMMENTS & DRAW'}
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Recent Posts from account */}
        <section className="mb-8 rounded-2xl border border-slate-850 bg-[#0f0f23]/60 p-6">
          <div className="mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-300">
              Account Content
            </span>
            <h2 className="mt-2 text-xl font-extrabold">Recent Posts from @itsmebinsabu</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select one of the recent Reels/Videos from the connected profile to auto-fill the URL.
            </p>
          </div>

          {instagramLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#161633]">
                  <div className="aspect-square animate-pulse bg-slate-800/60" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 animate-pulse rounded bg-slate-800/60" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800/60" />
                    <div className="h-10 animate-pulse rounded-xl bg-slate-800/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : instagramError ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
              {instagramError}
            </p>
          ) : instagramPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#161633] p-10 text-center text-slate-500">
              No recent Instagram posts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {instagramPosts.map((post) => (
                <article key={post.id} className="group overflow-hidden rounded-2xl border border-slate-855 bg-[#161633] flex flex-col justify-between h-full hover:border-slate-700 transition-all">
                  <div>
                    {/* Media Thumbnail Container with Video Overlay */}
                    <div className="aspect-square bg-slate-900 relative overflow-hidden">
                      {post.mediaUrl || post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl || post.mediaUrl}
                          alt={post.caption || 'Instagram post'}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          No Preview
                        </div>
                      )}
                      
                      {/* Video Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="h-11 w-11 rounded-full bg-white/20 hover:bg-white/35 border border-white/40 flex items-center justify-center text-white backdrop-blur-sm transition-all transform group-hover:scale-110">
                          <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white z-10">
                        {(post.id === 'itsmebinsabu_post_1' && mediaConfig.commentsCount !== undefined ? mediaConfig.commentsCount : post.commentsCount).toLocaleString()} comments
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-xs text-slate-300">
                        {post.caption || 'No caption'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleSelectPost(post)}
                      className={`w-full rounded-xl border py-2 text-xs font-bold transition-colors ${
                        selectedPostId === post.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {selectedPostId === post.id ? '✓ Selected' : 'Select Post'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Previous giveaways list */}
        <section className="border-t border-slate-900 pt-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-300">
                Giveaways
              </span>
              <h2 className="mt-1 text-2xl font-black">Giveaways History</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your previously created giveaways stored in the database.
              </p>
            </div>
            <input
              type="search"
              placeholder="Search giveaways..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0f0f23] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none sm:w-64"
            />
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-850 bg-[#0f0f23]/60 p-12 text-center text-slate-500">
              Loading giveaways...
            </div>
          ) : filteredGiveaways.length === 0 ? (
            <div className="rounded-2xl border border-slate-850 bg-[#0f0f23]/60 p-12 text-center text-slate-500">
              No giveaways found. Create your first giveaway using the rules generator card above.
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGiveaways.map((giveaway) => (
                <GiveawayCard key={giveaway._id} giveaway={giveaway} onDelete={handleDelete} />
              ))}
            </section>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
