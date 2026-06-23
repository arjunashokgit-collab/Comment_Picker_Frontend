const CommentTable = ({ comments = [] }) => {
  return (
    <section className="bg-[#0f0f23] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="border-b border-slate-800 px-5 py-4">
        <h2 className="text-lg font-bold text-white">Comments</h2>
        <p className="text-sm text-slate-500">Comment APIs are not available in the backend yet.</p>
      </div>

      {comments.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-semibold text-slate-300">No comments found</p>
          <p className="mt-1 text-sm text-slate-500">
            Add comment-fetching endpoints in the backend to populate this table.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[#11112a] text-left text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {comments.map((comment) => (
                <tr key={comment._id || comment.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{comment.user}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{comment.text}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{comment.status || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CommentTable;
