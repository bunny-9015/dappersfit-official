export default function AdminLoading() {
  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      <div className="h-14 bg-neutral-900 border-b border-white/10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 bg-white rounded-2xl border border-gray-200" />
          <div className="lg:col-span-7 h-96 bg-white rounded-2xl border border-gray-200" />
        </div>
      </div>
    </div>
  );
}
