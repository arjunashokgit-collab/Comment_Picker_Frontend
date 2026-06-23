import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAllGiveawaysAPI, getAPIErrorMessage } from '../services/allAPI';

const formatSelectedDate = (dateString) => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const Winners = () => {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWinners = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getAllGiveawaysAPI();
        setGiveaways(response.data?.data?.giveaways || []);
      } catch (err) {
        setError(getAPIErrorMessage(err, 'Failed to fetch winners history.'));
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  // Extract all winners from giveaways and tag them with giveaway context
  const allWinners = giveaways.flatMap((giveaway) =>
    (giveaway.winners || []).map((winner) => ({
      ...winner,
      giveawayId: giveaway._id,
      giveawayTitle: giveaway.title,
    }))
  ).sort((a, b) => new Date(b.selectedAt) - new Date(a.selectedAt)); // newest first

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">Winners</p>
          <h1 className="mt-2 text-3xl font-extrabold">All Winners History</h1>
          <p className="mt-2 text-sm text-slate-400">
            A list of all winners picked across your giveaways stored in MongoDB.
          </p>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0f0f23] p-12 text-center text-slate-400">
            Loading winners history...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            {error}
          </div>
        ) : allWinners.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-[#0f0f23] p-12 text-center">
            <h2 className="text-xl font-bold text-white">No winner data available yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Create a giveaway and select winners from comments to view them in this list.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {allWinners.map((winner, idx) => (
              <article
                key={winner._id || winner.commentId || idx}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-[#0f0f23] p-5 transition-all hover:border-violet-500/30 sm:flex-row sm:items-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-300">🏆 @{winner.username}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400 bg-[#1a1a35] px-2 py-0.5 rounded border border-slate-700">
                      Giveaway: {winner.giveawayTitle}
                    </span>
                  </div>
                  <p className="text-sm italic text-slate-300 font-medium">"{winner.commentText}"</p>
                  <p className="text-xs text-slate-500">
                    Selected: {formatSelectedDate(winner.selectedAt)}
                  </p>
                </div>
                <Link
                  to={`/giveaway/${winner.giveawayId}`}
                  className="rounded-xl border border-violet-500/30 px-4 py-2 text-center text-xs font-bold text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                  View Giveaway
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default Winners;
