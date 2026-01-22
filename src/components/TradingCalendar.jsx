import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, X, FileText, Check, Trash2 } from 'lucide-react'

// Notes storage key
const NOTES_STORAGE_KEY = 'ttm_calendar_notes'

const TradingCalendar = ({ trades = [], onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [noteModalDay, setNoteModalDay] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  })

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  // Get month/year info
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  // Calculate daily P&L from trades
  const dailyPnL = useMemo(() => {
    const pnlByDay = {}
    
    trades.forEach(trade => {
      if (!trade.settledAt && !trade.placedAt) return
      const date = new Date(trade.settledAt || trade.placedAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      
      if (!pnlByDay[key]) {
        pnlByDay[key] = { pnl: 0, trades: [], wins: 0, losses: 0 }
      }
      pnlByDay[key].pnl += trade.pnl || trade.profit || 0
      pnlByDay[key].trades.push(trade)
      if ((trade.pnl || trade.profit || 0) >= 0) {
        pnlByDay[key].wins++
      } else {
        pnlByDay[key].losses++
      }
    })
    
    return pnlByDay
  }, [trades])

  // Calculate max P&L for color intensity scaling
  const maxPnL = useMemo(() => {
    const values = Object.values(dailyPnL).map(d => Math.abs(d.pnl))
    return Math.max(...values, 100) // Min 100 to avoid division issues
  }, [dailyPnL])

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalPnl = 0
    let tradingDays = 0
    let winDays = 0
    let lossDays = 0
    
    Object.entries(dailyPnL).forEach(([key, data]) => {
      const [y, m] = key.split('-').map(Number)
      if (y === year && m === month) {
        totalPnl += data.pnl
        tradingDays++
        if (data.pnl >= 0) winDays++
        else lossDays++
      }
    })
    
    return { totalPnl, tradingDays, winDays, lossDays }
  }, [dailyPnL, year, month])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, key: `empty-${i}` })
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${month}-${day}`
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` // YYYY-MM-DD format
      const dayData = dailyPnL[key]
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
      
      days.push({
        day,
        key,
        dateKey,
        pnl: dayData?.pnl || 0,
        trades: dayData?.trades || [],
        wins: dayData?.wins || 0,
        losses: dayData?.losses || 0,
        hasTrades: !!dayData,
        isToday,
      })
    }
    
    return days
  }, [year, month, dailyPnL])

  // Get color based on P&L
  const getPnLColor = (pnl, hasTrades) => {
    if (!hasTrades) return 'bg-gray-50'
    if (pnl === 0) return 'bg-gray-100'
    
    const intensity = Math.min(Math.abs(pnl) / maxPnL, 1)
    
    if (pnl > 0) {
      if (intensity > 0.7) return 'bg-green-500 text-white'
      if (intensity > 0.4) return 'bg-green-400 text-white'
      if (intensity > 0.2) return 'bg-green-300'
      return 'bg-green-200'
    } else {
      if (intensity > 0.7) return 'bg-red-500 text-white'
      if (intensity > 0.4) return 'bg-red-400 text-white'
      if (intensity > 0.2) return 'bg-red-300'
      return 'bg-red-200'
    }
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Note functions
  const openNoteModal = (e, dayKey) => {
    e.stopPropagation()
    setNoteModalDay(dayKey)
    setNoteText(notes[dayKey] || '')
  }

  const saveNote = () => {
    if (noteModalDay) {
      if (noteText.trim()) {
        setNotes(prev => ({ ...prev, [noteModalDay]: noteText.trim() }))
      } else {
        // Remove empty notes
        setNotes(prev => {
          const newNotes = { ...prev }
          delete newNotes[noteModalDay]
          return newNotes
        })
      }
    }
    setNoteModalDay(null)
    setNoteText('')
  }

  const deleteNote = () => {
    if (noteModalDay) {
      setNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[noteModalDay]
        return newNotes
      })
    }
    setNoteModalDay(null)
    setNoteText('')
  }

  const handleDayClick = (dayData) => {
    if (dayData.hasTrades) {
      setSelectedDay(dayData)
      onDayClick?.(dayData)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Trading Calendar</h2>
              <p className="text-xs text-gray-500">Daily P&L heatmap</p>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {monthName} {year}
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className={`text-lg font-bold ${monthlyStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Monthly P&L</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{monthlyStats.tradingDays}</p>
            <p className="text-xs text-gray-500">Trading Days</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">{monthlyStats.winDays}</p>
            <p className="text-xs text-gray-500">Green Days</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-red-600">{monthlyStats.lossDays}</p>
            <p className="text-xs text-gray-500">Red Days</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayData) => (
            <div
              key={dayData.key}
              onClick={() => dayData.day && handleDayClick(dayData)}
              className={`
                aspect-square p-2 rounded-lg relative
                transition-all duration-200
                ${dayData.day ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300' : ''}
                ${dayData.isToday ? 'ring-2 ring-indigo-500' : ''}
                ${dayData.day ? getPnLColor(dayData.pnl, dayData.hasTrades) : ''}
              `}
            >
              {dayData.day && (
                <>
                  {/* Notepad Icon - Top Left */}
                  <button
                    onClick={(e) => openNoteModal(e, dayData.dateKey)}
                    className={`absolute top-1.5 left-1.5 p-1 rounded hover:bg-white/30 transition-colors z-10 ${
                      notes[dayData.dateKey] ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={notes[dayData.dateKey] ? 'View/Edit Note' : 'Add Note'}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  
                  {/* Date Number - Top Right */}
                  <span className={`absolute top-1.5 right-2 text-sm font-semibold ${
                    dayData.hasTrades && Math.abs(dayData.pnl) / maxPnL > 0.4 ? '' : 'text-gray-700'
                  }`}>
                    {dayData.day}
                  </span>
                  
                  {/* P&L Amount - Centered */}
                  {dayData.hasTrades && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${
                        Math.abs(dayData.pnl) / maxPnL > 0.4 ? '' : dayData.pnl >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {dayData.pnl >= 0 ? '+' : ''}{dayData.pnl.toFixed(0)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-400" />
            <span className="text-xs text-gray-500">Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-100" />
            <span className="text-xs text-gray-500">No trades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-400" />
            <span className="text-xs text-gray-500">Profit</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {new Date(year, month, selectedDay.day).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className={`text-sm font-medium ${selectedDay.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedDay.pnl >= 0 ? '+' : ''}${selectedDay.pnl.toFixed(2)} • {selectedDay.trades.length} trades
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {selectedDay.trades.map((trade, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{trade.ticker || trade.event}</p>
                      <p className="text-xs text-gray-500">{trade.platform} • {trade.position}</p>
                    </div>
                    <div className={`text-right ${(trade.pnl || trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="font-semibold">
                        {(trade.pnl || trade.profit || 0) >= 0 ? '+' : ''}${(trade.pnl || trade.profit || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalDay && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setNoteModalDay(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  {new Date(noteModalDay + 'T12:00:00').toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>
              <button
                onClick={() => setNoteModalDay(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Notes
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What went well today? What could be improved? Any lessons learned..."
                className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              
              <div className="flex items-center justify-between mt-4">
                {notes[noteModalDay] && (
                  <button
                    onClick={deleteNote}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <div className={`flex items-center gap-2 ${!notes[noteModalDay] ? 'ml-auto' : ''}`}>
                  <button
                    onClick={() => setNoteModalDay(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingCalendar
