const WinnerModal = ({ winner, onClose }) => {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#0f0f23] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Winner</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">{winner.name || winner.username}</h2>
            {winner.comment && <p className="mt-3 text-sm text-slate-300">{winner.comment}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
export { WinnerModal };
