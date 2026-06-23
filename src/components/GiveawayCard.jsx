import { Link } from 'react-router-dom';

const formatDate = (date) => {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const GiveawayCard = ({ giveaway, onDelete }) => {
  return (
    <article className="bg-[#0f0f23] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600" />

      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="inline-flex rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
              {giveaway.platform}
            </span>
            <span className="text-xs text-slate-500">{formatDate(giveaway.createdAt)}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{giveaway.title}</h3>
          <a
            href={giveaway.postUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block truncate text-sm text-slate-400 hover:text-violet-300"
          >
            {giveaway.postUrl}
          </a>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/giveaway/${giveaway._id}`}
            className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-center text-sm font-bold text-white"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onDelete?.(giveaway._id)}
            className="flex-1 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};

export default GiveawayCard;
