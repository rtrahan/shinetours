export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <div>
              <h1 className="heading-font text-2xl font-light text-stone-800">Admin Dashboard</h1>
              <p className="text-xs text-stone-500 uppercase tracking-widest">Next.js Version</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-stone-600 hover:text-stone-800 uppercase tracking-wide">← Home</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-8 py-12">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-12 text-center">
          <h2 className="heading-font text-4xl mb-6 text-stone-800">Admin Dashboard - Under Construction</h2>
          <p className="text-stone-600 mb-8 max-w-2xl mx-auto">
            This is the Next.js version. The admin dashboard with sortable tables, filters, and modals needs to be built.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
            <h3 className="font-bold text-blue-900 mb-4">What Needs to Be Built:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Unified table showing all tours</li>
              <li>• Filter pills (All, Needs Guide, Ready, etc.)</li>
              <li>• Sortable columns</li>
              <li>• Details modal for viewing participants</li>
              <li>• Yale submission modal with form info</li>
              <li>• Confirmation modal for entering Yale response</li>
              <li>• Guide assignment dropdowns</li>
              <li>• Status workflow buttons</li>
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-sm text-stone-500 mb-4">
              <strong>Meanwhile, the fully functional .NET version is running at:</strong>
            </p>
            <a href="http://localhost:5062/Admin/Dashboard" 
               target="_blank"
               className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Open Working .NET Admin Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

