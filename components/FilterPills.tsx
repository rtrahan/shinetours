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

  return (
    <div className="mb-4 md:mb-6 -mx-4 md:mx-0 px-4 md:px-0">
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide">
      {pills.map(pill => {
        const isActive = activeFilter === pill.id
        
        return (
          <button
            key={pill.id}
            onClick={() => onFilterChange(pill.id)}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${getColorClasses(pill.color, isActive)}`}
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

