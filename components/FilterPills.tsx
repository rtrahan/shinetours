'use client'

interface FilterPill {
  id: string
  label: string
  count: number
  color: string
}

interface FilterPillsProps {
  pills: FilterPill[]
  activeFilter: string
  onFilterChange: (filterId: string) => void
}

export default function FilterPills({ pills, activeFilter, onFilterChange }: FilterPillsProps) {
  const getColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-stone-800 text-white shadow-md'
    }
    
    const colors: Record<string, string> = {
      red: 'border-red-500 text-red-700 hover:bg-red-50',
      blue: 'border-blue-500 text-blue-700 hover:bg-blue-50',
      emerald: 'border-emerald-500 text-emerald-700 hover:bg-emerald-50',
      purple: 'border-purple-500 text-purple-700 hover:bg-purple-50',
      amber: 'border-amber-500 text-amber-700 hover:bg-amber-50',
      orange: 'border-orange-500 text-orange-700 hover:bg-orange-50',
      stone: 'border-stone-400 text-stone-700 hover:bg-stone-50',
    }
    
    return `bg-white border-2 ${colors[color] || colors.stone}`
  }

  const getDotColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      orange: 'bg-orange-500',
      stone: 'bg-stone-400',
    }
    return colors[color] || colors.stone
  }

  const activePill = pills.find(p => p.id === activeFilter) || pills[0]

  return (
    <div className="mb-4 md:mb-6">
      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Filter Tours
        </label>
        <select
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-stone-300 focus:border-stone-800 focus:outline-none text-sm rounded-lg font-semibold bg-white"
        >
          {pills.map(pill => (
            <option key={pill.id} value={pill.id}>
              {pill.label} ({pill.count})
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Pills */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        {pills.map(pill => {
          const isActive = activeFilter === pill.id
          
          return (
            <button
              key={pill.id}
              onClick={() => onFilterChange(pill.id)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${getColorClasses(pill.color, isActive)}`}
            >
              {!isActive && pill.color !== 'none' && (
                <span className={`inline-block w-2 h-2 rounded-full ${getDotColor(pill.color)} mr-2`}></span>
              )}
              {pill.label} ({pill.count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

