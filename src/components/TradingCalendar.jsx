import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, FileText } from 'lucide-react'

const TradingCalendar = ({ trades = [], onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    const days = []
    
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, isEmpty: true })
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.settledAt || trade.closedAt || trade.timestamp || trade.date)
        return tradeDate.getFullYear() === year &&
               tradeDate.getMonth() === month &&
               tradeDate.getDate() === day
      })
      
      const totalPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || t.profit || 0), 0)
      const tradeCount = dayTrades.length
      
      days.push({
        day,
        pnl: totalPnl,
        trades: tradeCount,
        hasTrades: tradeCount > 0,
        isProfit: totalPnl > 0,
        isLoss: totalPnl < 0,
        isToday: new Date().toDateString() === new Date(year, month, day).toDateString(),
      })
    }
    return days
  }, [currentDate, trades])
  
  const goToPreviousMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const goToToday = () => setCurrentDate(new Date())
  
  const formatPnl = (value) => {
    if (value === 0) return '$0'
    const prefix = value > 0 ? '+' : ''
    return Math.abs(value) >= 1000 ? `${prefix}$${(value / 1000).toFixed(1)}K` : `${prefix}$${value.toFixed(0)}`
  }
  
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{monthYear}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200">Today</button>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl"><Calendar className="w-5 h-5 text-gray-400" /></div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{day}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((dayData, index) => {
            if (dayData.isEmpty) return <div key={`empty-${index}`} className="aspect-square" />
            
            const { day, hasTrades, isProfit, isLoss, pnl, trades: tradeCount, isToday } = dayData
            
            let bgClass = 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            let borderClass = 'border-transparent'
            let textClass = 'text-gray-400'

            if (hasTrades) {
              if (isProfit) {
                bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                borderClass = 'border-emerald-400 dark:border-emerald-500'
                textClass = 'text-emerald-700 dark:text-emerald-400'
              } else if (isLoss) {
                bgClass = 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                borderClass = 'border-red-400 dark:border-red-500'
                textClass = 'text-red-700 dark:text-red-400'
              }
            }
            
            return (
              <div
                key={day}
                onClick={() => hasTrades && onDayClick && onDayClick(dayData)}
                className={`aspect-square rounded-xl border-2 p-1.5 sm:p-2 transition-all duration-200 ease-out ${bgClass} ${borderClass} ${hasTrades ? 'cursor-pointer active:scale-95 shadow-sm hover:shadow-md' : ''} ${isToday ? 'ring-2 ring-indigo-400 ring-offset-2' : ''} relative flex flex-col`}
              >
                <div className="flex items-start justify-between">
                  {hasTrades && (
                    <div className={`p-1.5 sm:p-2 rounded-lg ${isProfit ? 'bg-emerald-200/60 dark:bg-emerald-800/40' : 'bg-red-200/60 dark:bg-red-800/40'}`}>
                      <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                  )}
                  {!hasTrades && <div className="w-8 h-8 sm:w-10 sm:h-10" />}
                  <span className={`text-sm sm:text-base font-bold ${hasTrades ? (isProfit ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300') : 'text-gray-500 dark:text-gray-400'}`}>{day}</span>
                </div>
                
                {hasTrades && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className={`text-lg sm:text-xl font-bold ${textClass}`}>{formatPnl(pnl)}</span>
                  </div>
                )}
                
                {hasTrades && (
                  <div className="flex justify-end">
                    <span className={`text-xs sm:text-sm font-semibold px-1.5 py-0.5 rounded-md ${isProfit ? 'bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300' : 'bg-red-200/80 dark:bg-red-800/60 text-red-700 dark:text-red-300'}`}>{tradeCount} trade{tradeCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Profit Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loss Day</span>
            </div>
          </div>
          {(() => {
            const monthlyTrades = calendarData.filter(d => d.hasTrades)
            const totalPnl = monthlyTrades.reduce((sum, d) => sum + d.pnl, 0)
            const totalTrades = monthlyTrades.reduce((sum, d) => sum + d.trades, 0)
            const profitDays = monthlyTrades.filter(d => d.isProfit).length
            const lossDays = monthlyTrades.filter(d => d.isLoss).length
            return (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monthly P&L</p>
                  <p className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatPnl(totalPnl)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{profitDays + lossDays > 0 ? `${Math.round((profitDays / (profitDays + lossDays)) * 100)}%` : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trades</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{totalTrades}</p>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default TradingCalendar
