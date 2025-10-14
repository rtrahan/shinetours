export default function GuideDashboard() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div>
              <h1 className="heading-font text-2xl font-light text-stone-800">Guide Dashboard</h1>
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
          <h2 className="heading-font text-4xl mb-6 text-stone-800">Guide Dashboard - Under Construction</h2>
          <p className="text-stone-600 mb-8 max-w-2xl mx-auto">
            This is the Next.js version. The guide dashboard with tour claiming and workflow needs to be built.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
            <h3 className="font-bold text-purple-900 mb-4">What Needs to Be Built:</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>• View all tours (mine, available, others)</li>
              <li>• Filter pills for tour categories</li>
              <li>• Claim/release tour functionality</li>
              <li>• Submit to Yale for claimed tours</li>
              <li>• Enter Yale confirmation</li>
              <li>• Mark tours complete</li>
              <li>• View participant details modal</li>
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-sm text-stone-500 mb-4">
              <strong>Meanwhile, the fully functional .NET version is running at:</strong>
            </p>
            <a href="http://localhost:5062/Guide/Dashboard" 
               target="_blank"
               className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Open Working .NET Guide Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

