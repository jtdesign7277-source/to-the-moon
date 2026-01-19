import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Activity, Rocket, Wrench } from 'lucide-react'

const templates = [
  { name: 'Conservative Arb Bot', description: '87% win rate, 3% min edge', difficulty: 'Beginner', winRate: '87%', icon: '🛡️' },
  { name: 'Sports High Volume', description: '74% win rate, high frequency', difficulty: 'Intermediate', winRate: '74%', icon: '⚽' },
  { name: 'Crypto Volatility Play', description: '61% win rate, high returns', difficulty: 'Advanced', winRate: '61%', icon: '📈' },
  { name: 'Political Momentum', description: '68% win rate, event-driven', difficulty: 'Intermediate', winRate: '68%', icon: '🏛️' },
  { name: 'Multi-Platform Arb Pro', description: '79% win rate, cross-platform', difficulty: 'Advanced', winRate: '79%', icon: '🔄' },
  { name: 'Fed News Scalper', description: '92% win rate, news-based', difficulty: 'Expert', winRate: '92%', icon: '📰' },
]

const backtestData = [
  { month: 'Jan', pnl: 1200 },
  { month: 'Feb', pnl: 1800 },
  { month: 'Mar', pnl: 1400 },
  { month: 'Apr', pnl: 2200 },
  { month: 'May', pnl: 2800 },
  { month: 'Jun', pnl: 2400 },
]

const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700'
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700'
    case 'Advanced':
      return 'bg-orange-100 text-orange-700'
    case 'Expert':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const StrategyBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strategy Builder Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Create, backtest, and deploy custom trading strategies.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus className="w-4 h-4" />
          New Strategy
        </button>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Start with a Template</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <button
              key={i}
              onClick={() => setSelectedTemplate(i)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedTemplate === i
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{template.icon}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyStyle(template.difficulty)}`}>
                  {template.difficulty}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm font-medium text-green-600">{template.winRate} Win Rate</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Canvas */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Strategy Canvas</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Backtest
              </button>
              <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-lg shadow-indigo-500/25">
                <Rocket className="w-4 h-4" />
                Deploy
              </button>
            </div>
          </div>
          <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Drag and drop blocks to build your strategy</p>
              <p className="text-gray-400 text-sm mt-2">Select a template above or start from scratch</p>
            </div>
          </div>
        </div>

        {/* Backtest Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Backtest Preview</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backtestData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="pnl" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. Win Rate</span>
              <span className="font-medium text-gray-900">74%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. Monthly Return</span>
              <span className="font-medium text-green-600">+8.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Max Drawdown</span>
              <span className="font-medium text-gray-900">-12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrategyBuilder
