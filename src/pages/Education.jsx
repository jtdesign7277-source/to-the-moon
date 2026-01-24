/**
 * Education Page
 * Explains backtesting methodology, data collection, and risk metrics
 * Builds trust through transparency
 */

import { useState } from 'react'
import {
  BookOpen,
  TrendingUp,
  Database,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Target,
  Zap,
  LineChart,
  PieChart,
  Activity,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

// Expandable section component
const ExpandableSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-indigo-500" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}

// Comparison card for good vs bad practices
const ComparisonCard = ({ good, bad, title }) => (
  <div className="grid md:grid-cols-2 gap-4 mt-4">
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
        <span className="font-medium text-red-700 dark:text-red-400">Bad Practice (Hindsight Bias)</span>
      </div>
      <p className="text-sm text-red-600 dark:text-red-300">{bad}</p>
    </div>
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
        <span className="font-medium text-green-700 dark:text-green-400">Our Approach (No Hindsight)</span>
      </div>
      <p className="text-sm text-green-600 dark:text-green-300">{good}</p>
    </div>
  </div>
)

// Metric explanation card
const MetricCard = ({ title, formula, interpretation, example, color = 'indigo' }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
  }

  return (
    <div className={`p-4 rounded-xl border ${colorStyles[color]}`}>
      <h4 className="font-semibold mb-2">{title}</h4>
      {formula && (
        <div className="font-mono text-sm bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg mb-2">
          {formula}
        </div>
      )}
      <p className="text-sm opacity-90 mb-2">{interpretation}</p>
      {example && (
        <p className="text-xs opacity-75 italic">{example}</p>
      )}
    </div>
  )
}

const Education = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          Education Center
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Understanding Our Backtesting Methodology
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Transparency builds trust. Learn exactly how we test strategies, collect data,
          and calculate metrics. No black boxes, no misleading statistics.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">6 Mo</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Backtest Period</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">200+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Historical Markets</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Hindsight Bias</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">2</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Data Sources</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Section 1: How Backtests Work */}
        <ExpandableSection
          title="How Backtests Work"
          icon={BarChart3}
          defaultOpen={true}
        >
          <div className="mt-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              A backtest simulates how a trading strategy would have performed on historical data.
              It's like a time machine for trading - we replay past market conditions and see how
              our rules would have triggered trades.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">The Backtesting Process</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Collect Historical Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gather resolved markets with complete price history from Kalshi and Manifold</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Apply Strategy Rules</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For each market, check if our entry conditions would have been met</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Simulate Trades</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Execute virtual trades based on entry signals, without knowing outcomes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Calculate Results</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Measure P&L, win rate, drawdowns, and risk-adjusted metrics</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">Important Limitation</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Backtests show what <em>would have</em> happened, not what <em>will</em> happen.
                    Market conditions change, liquidity varies, and execution differs in live trading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Section 2: No Hindsight Bias */}
        <ExpandableSection
          title="Why Our Results Are Realistic (No Hindsight Bias)"
          icon={Eye}
        >
          <div className="mt-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Hindsight bias</strong> is the #1 reason backtests fail in live trading.
              It's when a strategy "knows" information it couldn't have known at the time -
              like trading based on tomorrow's news.
            </p>

            <div className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                How We Eliminate Hindsight Bias
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Entry decisions use only early price data</strong> - We look at the first third of a market's price history, not the resolution</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                  <span><strong>No knowledge of outcomes</strong> - The strategy doesn't know if a market resolved YES or NO when deciding to enter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Realistic entry logic</strong> - Trades are based on price signals and momentum, not future events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Win rates are NOT 100%</strong> - Our strategies lose trades, just like in real markets</span>
                </li>
              </ul>
            </div>

            <ComparisonCard
              bad="Looking at a market that resolved YES, then 'deciding' to buy YES at the start. This creates fake 100% win rates."
              good="Looking at early price momentum (e.g., price rising from $0.45 to $0.55), then deciding to buy YES based on that signal alone."
            />

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Example: Momentum Strategy Entry</h4>
              <div className="font-mono text-sm bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <pre className="text-gray-700 dark:text-gray-300">{`// At entry time, we only see early prices
early_prices = market.price_history[:len/3]  // First third only

// Calculate momentum from visible data
first_price = 0.45
last_early_price = 0.55
trend = +0.10  // Price is rising

// Decision based ONLY on trend, not outcome
if trend > min_edge:
    enter_trade(side='YES')  // Following momentum

// We DON'T know if market resolves YES or NO!
// Sometimes we're right, sometimes wrong.`}</pre>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Section 3: Data Collection */}
        <ExpandableSection
          title="How We Collect Real Market Data"
          icon={Database}
        >
          <div className="mt-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Our backtests use real historical data from two major prediction market platforms.
              We only use <strong>resolved markets</strong> where the outcome is known, giving us
              ground truth for measuring strategy performance.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🎲</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Kalshi</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CFTC-Regulated Exchange</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    Politics & Elections
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    Economics & Fed Decisions
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    Sports Events
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                    Real USD liquidity
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🔮</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Manifold Markets</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Community Prediction Platform</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                    Tech & AI Predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                    Crypto Markets
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                    Wide variety of topics
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                    High market volume
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Data We Collect Per Market</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Market Title</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">"Will X happen?"</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Price History</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Time-series data</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Resolution</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">YES / NO</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Trading activity</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">Data Freshness</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Our historical data is cached for 24 hours and can be refreshed on-demand.
                    We analyze 6 months of resolved markets for statistically significant results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Section 4: Sharpe Ratio Explained */}
        <ExpandableSection
          title="Understanding the Sharpe Ratio"
          icon={TrendingUp}
        >
          <div className="mt-4 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              The <strong>Sharpe Ratio</strong> is the gold standard for measuring risk-adjusted returns.
              It answers: "How much return am I getting for each unit of risk I'm taking?"
            </p>

            <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-5 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">The Formula</h4>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                <p className="font-mono text-lg text-center text-gray-800 dark:text-gray-200">
                  Sharpe Ratio = (Return - Risk-Free Rate) / Standard Deviation
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Return</p>
                  <p className="text-gray-600 dark:text-gray-400">Your strategy's gains</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Risk-Free Rate</p>
                  <p className="text-gray-600 dark:text-gray-400">~5% (Treasury yield)</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Std Deviation</p>
                  <p className="text-gray-600 dark:text-gray-400">Volatility of returns</p>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white">How to Interpret Sharpe Ratio</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <MetricCard
                title="Sharpe < 1.0"
                interpretation="Below average risk-adjusted returns. The strategy may not be worth the volatility."
                example="A 10% return with 15% volatility = 0.67 Sharpe"
                color="orange"
              />
              <MetricCard
                title="Sharpe 1.0 - 2.0"
                interpretation="Good risk-adjusted returns. Acceptable for most trading strategies."
                example="A 15% return with 10% volatility = 1.5 Sharpe"
                color="green"
              />
              <MetricCard
                title="Sharpe 2.0 - 3.0"
                interpretation="Excellent risk-adjusted returns. Very efficient use of capital."
                example="A 20% return with 8% volatility = 2.5 Sharpe"
                color="indigo"
              />
              <MetricCard
                title="Sharpe > 3.0"
                interpretation="Exceptional (or suspicious). Verify data quality and methodology."
                example="Hedge funds rarely sustain Sharpe > 2.0 long-term"
                color="purple"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Sharpe vs Sortino Ratio</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sharpe Ratio</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Penalizes ALL volatility equally - both upside and downside.
                    A strategy that swings wildly but always ends up will have a lower Sharpe.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sortino Ratio</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Only penalizes DOWNSIDE volatility. Better for strategies where
                    upside variance is desirable (you want big wins!).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Section 5: Past Performance Disclaimer */}
        <ExpandableSection
          title="Why Past Performance Doesn't Guarantee Future Results"
          icon={AlertTriangle}
        >
          <div className="mt-4 space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Critical Disclaimer</h4>
                  <p className="text-red-700 dark:text-red-400">
                    All backtest results shown are hypothetical and based on historical data.
                    <strong> Past performance is NOT indicative of future results.</strong> You could
                    lose some or all of your investment.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              This isn't just legal boilerplate - there are real reasons why backtests
              don't perfectly predict live performance:
            </p>

            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Market Conditions Change</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The 2024 election cycle had unique characteristics. Future markets may behave
                      differently due to new regulations, participants, or events.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Execution Slippage</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Backtests assume perfect fills at exact prices. In reality, your orders
                      move the market, especially in lower-liquidity markets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Strategy Crowding</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      If many people use the same strategy, the edge disappears.
                      Profitable strategies attract competition.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Overfitting Risk</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Strategies optimized too precisely on historical data may fail on new data.
                      We use general rules, not curve-fitted parameters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <PieChart className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Sample Size Limitations</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      6 months of data (~180 days) provides a reasonable sample, but rare events
                      (black swans) may not be represented.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Our Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <span><strong>Start with paper trading</strong> - Test strategies with virtual money first</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <span><strong>Use proper position sizing</strong> - Never risk more than you can afford to lose</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <span><strong>Diversify across strategies</strong> - Don't put all capital in one approach</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <span><strong>Monitor live performance</strong> - If results diverge significantly, pause and investigate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <span><strong>Expect drawdowns</strong> - Even good strategies have losing streaks</span>
                </li>
              </ul>
            </div>
          </div>
        </ExpandableSection>

        {/* Additional Resources */}
        <ExpandableSection
          title="Additional Risk Metrics Explained"
          icon={LineChart}
        >
          <div className="mt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <MetricCard
                title="Win Rate"
                formula="Winning Trades / Total Trades"
                interpretation="Percentage of trades that are profitable. Higher isn't always better - depends on risk/reward ratio."
                example="60% win rate with 2:1 reward:risk is better than 80% with 1:4"
                color="green"
              />
              <MetricCard
                title="Max Drawdown"
                formula="(Peak - Trough) / Peak"
                interpretation="Largest peak-to-valley decline. Shows worst-case scenario you need to survive."
                example="-15% drawdown means account dropped 15% from its high"
                color="orange"
              />
              <MetricCard
                title="Profit Factor"
                formula="Gross Profits / Gross Losses"
                interpretation="How much you win for every dollar lost. Above 1.5 is generally good."
                example="Profit factor of 2.0 = $2 won for every $1 lost"
                color="indigo"
              />
              <MetricCard
                title="Expectancy"
                formula="(Win% × Avg Win) + (Loss% × Avg Loss)"
                interpretation="Expected profit per trade on average. Must be positive for profitable strategy."
                example="$15 expectancy means you expect to make $15 per trade on average"
                color="purple"
              />
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* Final CTA */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Ready to Explore Strategies?</h2>
        <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
          Now that you understand our methodology, explore our pre-built strategies
          or create your own with confidence.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/strategy-builder"
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            View Strategies
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-8">
        <p>
          This educational content is for informational purposes only and does not constitute
          financial advice. Trading prediction markets involves risk of loss.
          Always do your own research.
        </p>
      </div>
    </div>
  )
}

export default Education
