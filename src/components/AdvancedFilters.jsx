import { useState } from 'react'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Shield,
  Layers,
  Timer,
} from 'lucide-react'

// Filter Section Component
const FilterSection = ({ title, icon: _Icon, children, defaultOpen = false, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4 border-t border-gray-100">{children}</div>}
    </div>
  )
}

// Toggle Button Component
const _ToggleButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
)

// Slider with Label
const _LabeledSlider = ({ label, value, onChange, min, max, step = 1, unit = '', showValue = true }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {showValue && (
        <span className="text-sm font-semibold text-indigo-600">
          {value}{unit}
        </span>
      )}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
    <div className="flex justify-between text-xs text-gray-400">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
)

// Toggle Switch
const _ToggleSwitch = ({ label, enabled, onChange, description }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-indigo-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  </div>
)

// Multi-select Chip
const _Chip = ({ label, selected, onClick, count }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      selected
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`text-xs ${selected ? 'text-indigo-200' : 'text-gray-400'}`}>
        ({count})
      </span>
    )}
  </button>
)

// Default filter values
const DEFAULT_FILTERS = {
  // Timeframe
  timeframe: '3m',
  
  // Volume
  volumeFilter: 'all',
  spikeDetection: false,
  spikeThreshold: 200,
  spikeTimeframe: '1hr',
  minLiquidity: 1000,
  
  // Line Movement
  lineMovementEnabled: false,
  movementThreshold: 10,
  movementTimeframe: '4hr',
  movementDirection: 'any',
  velocityThreshold: 2,
  
  // Volatility
  volatilityEnabled: false,
  minPriceSwing: 20,
  volatilityLookback: '1w',
  oscillationCount: 3,
  meanReversionCandidate: false,
  
  // Categories
  selectedCategories: [],
  selectedSubcategories: [],
  
  // Timing
  minTimeToResolution: 1,
  maxTimeToResolution: 30,
  minMarketAge: 0,
  tradingHoursOnly: false,
  
  // Risk
  maxPositionSize: 10,
  dailyLossLimit: 5,
  kellyEnabled: false,
  drawdownProtection: 20,
}

const CATEGORIES = [
  { id: 'politics', label: 'Politics', count: 156, subcategories: ['Elections', 'Policy', 'International', 'Legislation'] },
  { id: 'crypto', label: 'Crypto', count: 89, subcategories: ['Bitcoin', 'Ethereum', 'Altcoins', 'DeFi', 'NFTs'] },
  { id: 'sports', label: 'Sports', count: 234, subcategories: ['Football', 'Basketball', 'Baseball', 'Soccer', 'MMA'] },
  { id: 'finance', label: 'Finance', count: 78, subcategories: ['Fed', 'Earnings', 'IPOs', 'M&A', 'Indices'] },
  { id: 'entertainment', label: 'Entertainment', count: 45, subcategories: ['Awards', 'Box Office', 'TV', 'Music'] },
  { id: 'science', label: 'Science & Tech', count: 67, subcategories: ['AI', 'Space', 'Climate', 'Biotech'] },
  { id: 'weather', label: 'Weather', count: 34, subcategories: ['Temperature', 'Precipitation', 'Storms'] },
]

const TIMEFRAME_OPTIONS = [
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
]

const AdvancedFilters = ({ filters = DEFAULT_FILTERS, onChange, onReset, onSavePreset }) => {
  // Initialize from props, re-render will update automatically via key or parent
  const [localFilters, setLocalFilters] = useState(() => ({ ...DEFAULT_FILTERS, ...filters }))
  const [presetName, setPresetName] = useState('')
  const [showSavePreset, setShowSavePreset] = useState(false)

  const updateFilter = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onChange?.(newFilters)
  }

  const toggleCategory = (categoryId) => {
    const current = localFilters.selectedCategories || []
    const newCategories = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId]
    updateFilter('selectedCategories', newCategories)
  }

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS)
    onReset?.()
    onChange?.(DEFAULT_FILTERS)
  }

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset?.({ name: presetName, filters: localFilters })
      setPresetName('')
      setShowSavePreset(false)
    }
  }

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'timeframe') return false
    if (typeof value === 'boolean') return value
    if (Array.isArray(value)) return value.length > 0
    if (key === 'volumeFilter') return value !== 'all'
    return false
  }).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavePreset(!showSavePreset)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Save preset"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Reset to defaults"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Preset Modal */}
      {showSavePreset && (
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
          <p className="text-sm font-medium text-indigo-900 mb-2">Save Filter Preset</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="My Volatility Hunter"
              className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSavePreset}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Performance Timeframe */}
      <FilterSection title="Performance Timeframe" icon={Clock} defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAME_OPTIONS.map((option) => (
            <ToggleButton
              key={option.id}
              label={option.label}
              active={localFilters.timeframe === option.id}
              onClick={() => updateFilter('timeframe', option.id)}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Backtest results will be calculated using data from the selected period
        </p>
      </FilterSection>

      {/* Volume Filters */}
      <FilterSection title="Volume & Liquidity" icon={BarChart3}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Volume Level</label>
            <div className="flex gap-2">
              {['all', 'high', 'medium', 'low'].map((level) => (
                <ToggleButton
                  key={level}
                  label={level.charAt(0).toUpperCase() + level.slice(1)}
                  active={localFilters.volumeFilter === level}
                  onClick={() => updateFilter('volumeFilter', level)}
                />
              ))}
            </div>
          </div>

          <ToggleSwitch
            label="Volume Spike Detection"
            description="Find markets with unusual volume activity"
            enabled={localFilters.spikeDetection}
            onChange={(v) => updateFilter('spikeDetection', v)}
          />

          {localFilters.spikeDetection && (
            <div className="pl-4 border-l-2 border-indigo-200 space-y-4">
              <LabeledSlider
                label="Spike Threshold"
                value={localFilters.spikeThreshold}
                onChange={(v) => updateFilter('spikeThreshold', v)}
                min={100}
                max={500}
                step={25}
                unit="%"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Spike Timeframe</label>
                <div className="flex flex-wrap gap-2">
                  {['15min', '1hr', '4hr', '24hr'].map((tf) => (
                    <ToggleButton
                      key={tf}
                      label={tf}
                      active={localFilters.spikeTimeframe === tf}
                      onClick={() => updateFilter('spikeTimeframe', tf)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Minimum Liquidity: ${localFilters.minLiquidity.toLocaleString()}
            </label>
            <input
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={localFilters.minLiquidity}
              onChange={(e) => updateFilter('minLiquidity', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </FilterSection>

      {/* Line Movement Filters */}
      <FilterSection title="Line Movement" icon={TrendingUp} badge="Critical">
        <div className="space-y-4">
          <ToggleSwitch
            label="Enable Line Movement Filter"
            description="Find markets where odds are shifting significantly"
            enabled={localFilters.lineMovementEnabled}
            onChange={(v) => updateFilter('lineMovementEnabled', v)}
          />

          {localFilters.lineMovementEnabled && (
            <div className="space-y-4 p-4 bg-indigo-50 rounded-xl">
              <LabeledSlider
                label="Movement Threshold"
                value={localFilters.movementThreshold}
                onChange={(v) => updateFilter('movementThreshold', v)}
                min={1}
                max={50}
                unit="%"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Movement Timeframe</label>
                <div className="flex flex-wrap gap-2">
                  {['15min', '1hr', '4hr', '24hr', '1week'].map((tf) => (
                    <ToggleButton
                      key={tf}
                      label={tf}
                      active={localFilters.movementTimeframe === tf}
                      onClick={() => updateFilter('movementTimeframe', tf)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Direction</label>
                <div className="flex gap-2">
                  {[
                    { id: 'any', label: 'Any', icon: Activity },
                    { id: 'rising', label: 'Rising', icon: TrendingUp },
                    { id: 'falling', label: 'Falling', icon: TrendingDown },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      onClick={() => updateFilter('movementDirection', dir.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        localFilters.movementDirection === dir.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <dir.icon className="w-4 h-4" />
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>

              <LabeledSlider
                label="Velocity Threshold"
                value={localFilters.velocityThreshold}
                onChange={(v) => updateFilter('velocityThreshold', v)}
                min={0.5}
                max={10}
                step={0.5}
                unit="% / hr"
              />

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <span className="font-medium">Current Filter:</span> Find markets where odds moved ≥{localFilters.movementThreshold}% 
                  {localFilters.movementDirection !== 'any' && ` ${localFilters.movementDirection}`} within {localFilters.movementTimeframe}
                </p>
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Volatility/Oscillation Filters */}
      <FilterSection title="Volatility & Oscillation" icon={Activity} badge="Critical">
        <div className="space-y-4">
          <ToggleSwitch
            label="Enable Volatility Filter"
            description="Find markets with significant price swings"
            enabled={localFilters.volatilityEnabled}
            onChange={(v) => updateFilter('volatilityEnabled', v)}
          />

          {localFilters.volatilityEnabled && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-xl">
              <LabeledSlider
                label="Minimum Price Swing"
                value={localFilters.minPriceSwing}
                onChange={(v) => updateFilter('minPriceSwing', v)}
                min={5}
                max={50}
                unit="%"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Lookback Period</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '1d', label: '1 Day' },
                    { id: '1w', label: '1 Week' },
                    { id: '1m', label: '1 Month' },
                  ].map((period) => (
                    <ToggleButton
                      key={period.id}
                      label={period.label}
                      active={localFilters.volatilityLookback === period.id}
                      onClick={() => updateFilter('volatilityLookback', period.id)}
                    />
                  ))}
                </div>
              </div>

              <LabeledSlider
                label="Oscillation Count (midpoint crosses)"
                value={localFilters.oscillationCount}
                onChange={(v) => updateFilter('oscillationCount', v)}
                min={1}
                max={10}
                unit="x"
              />

              <ToggleSwitch
                label="Mean Reversion Candidates Only"
                description="Markets likely to revert to historical average"
                enabled={localFilters.meanReversionCandidate}
                onChange={(v) => updateFilter('meanReversionCandidate', v)}
              />

              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">Current Filter:</span> Find markets that swung ≥{localFilters.minPriceSwing}% 
                  at least {localFilters.oscillationCount} times in the past {
                    localFilters.volatilityLookback === '1d' ? 'day' :
                    localFilters.volatilityLookback === '1w' ? 'week' : 'month'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Category Filters */}
      <FilterSection 
        title="Categories" 
        icon={Layers}
        badge={localFilters.selectedCategories?.length > 0 ? `${localFilters.selectedCategories.length} selected` : undefined}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                label={category.label}
                count={category.count}
                selected={localFilters.selectedCategories?.includes(category.id)}
                onClick={() => toggleCategory(category.id)}
              />
            ))}
          </div>

          {localFilters.selectedCategories?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategories</p>
              {CATEGORIES
                .filter(c => localFilters.selectedCategories.includes(c.id))
                .map(category => (
                  <div key={category.id}>
                    <p className="text-sm font-medium text-gray-700 mb-2">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map(sub => (
                        <Chip
                          key={sub}
                          label={sub}
                          selected={localFilters.selectedSubcategories?.includes(sub)}
                          onClick={() => {
                            const current = localFilters.selectedSubcategories || []
                            const newSubs = current.includes(sub)
                              ? current.filter(s => s !== sub)
                              : [...current, sub]
                            updateFilter('selectedSubcategories', newSubs)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* Timing Filters */}
      <FilterSection title="Timing" icon={Timer}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Time to Resolution: {localFilters.minTimeToResolution} - {localFilters.maxTimeToResolution} days
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={1}
                max={365}
                value={localFilters.minTimeToResolution}
                onChange={(e) => updateFilter('minTimeToResolution', Math.min(Number(e.target.value), localFilters.maxTimeToResolution))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="range"
                min={1}
                max={365}
                value={localFilters.maxTimeToResolution}
                onChange={(e) => updateFilter('maxTimeToResolution', Math.max(Number(e.target.value), localFilters.minTimeToResolution))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <LabeledSlider
            label="Minimum Market Age"
            value={localFilters.minMarketAge}
            onChange={(v) => updateFilter('minMarketAge', v)}
            min={0}
            max={30}
            unit=" days"
          />

          <ToggleSwitch
            label="Trading Hours Only"
            description="Only include markets active during peak hours (9am-5pm ET)"
            enabled={localFilters.tradingHoursOnly}
            onChange={(v) => updateFilter('tradingHoursOnly', v)}
          />
        </div>
      </FilterSection>

      {/* Risk Parameters */}
      <FilterSection title="Risk Parameters" icon={Shield}>
        <div className="space-y-4">
          <LabeledSlider
            label="Max Position Size"
            value={localFilters.maxPositionSize}
            onChange={(v) => updateFilter('maxPositionSize', v)}
            min={1}
            max={25}
            unit="% of bankroll"
          />

          <LabeledSlider
            label="Daily Loss Limit"
            value={localFilters.dailyLossLimit}
            onChange={(v) => updateFilter('dailyLossLimit', v)}
            min={1}
            max={20}
            unit="% of bankroll"
          />

          <ToggleSwitch
            label="Kelly Criterion Sizing"
            description="Automatically calculate optimal bet size based on edge"
            enabled={localFilters.kellyEnabled}
            onChange={(v) => updateFilter('kellyEnabled', v)}
          />

          <LabeledSlider
            label="Drawdown Protection"
            value={localFilters.drawdownProtection}
            onChange={(v) => updateFilter('drawdownProtection', v)}
            min={5}
            max={50}
            unit="%"
          />

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Risk parameters will pause strategy execution when limits are reached.
              Daily loss limit: ${((localFilters.dailyLossLimit / 100) * 10000).toFixed(0)} based on $10k bankroll.
            </p>
          </div>
        </div>
      </FilterSection>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-gray-900">Active Filters Summary</p>
            <span className="text-sm text-indigo-600">{activeFiltersCount} filters applied</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {localFilters.volumeFilter !== 'all' && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Volume: {localFilters.volumeFilter}
              </span>
            )}
            {localFilters.spikeDetection && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Spike Detection: {localFilters.spikeThreshold}%
              </span>
            )}
            {localFilters.lineMovementEnabled && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Line Movement: ≥{localFilters.movementThreshold}% / {localFilters.movementTimeframe}
              </span>
            )}
            {localFilters.volatilityEnabled && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Volatility: ≥{localFilters.minPriceSwing}% swing
              </span>
            )}
            {localFilters.selectedCategories?.length > 0 && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Categories: {localFilters.selectedCategories.length}
              </span>
            )}
            {localFilters.kellyEnabled && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Kelly Sizing: On
              </span>
            )}
            {localFilters.meanReversionCandidate && (
              <span className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                Mean Reversion
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { AdvancedFilters, DEFAULT_FILTERS }
export default AdvancedFilters
