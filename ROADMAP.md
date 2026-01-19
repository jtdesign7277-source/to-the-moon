# TO THE MOON - Feature Roadmap

## Strategy Builder Enhancements

### Duplicate Strategy
- [ ] "Duplicate" button on custom strategy cards
- [ ] Creates a copy with "(Copy)" appended to name
- [ ] Opens wizard pre-filled with duplicated values
- [ ] Useful for creating variations of a working strategy

### Strategy Versioning
- [ ] Track version history for each strategy
- [ ] View previous versions and their backtest results
- [ ] Revert to previous version if needed
- [ ] Compare performance across versions
- [ ] Auto-increment version on save

### Compare Backtests
- [ ] Side-by-side comparison view for 2-3 strategies
- [ ] Overlay equity curves on same chart
- [ ] Table comparing key metrics (win rate, Sharpe, drawdown)
- [ ] Highlight which strategy wins on each metric
- [ ] Export comparison as PDF/image

### Export/Import Strategies
- [ ] Export strategy config to JSON file
- [ ] Import strategy from JSON
- [ ] Share strategies via unique link
- [ ] QR code for mobile sharing
- [ ] Marketplace submission from export

### Strategy Notes
- [ ] Add comments/rationale for parameter choices
- [ ] Document why certain entry/exit conditions were chosen
- [ ] Record market conditions strategy was designed for
- [ ] Tag strategies (e.g., "bull market", "high volatility")
- [ ] Search/filter by tags

### Persistence (Backend Storage)
- [ ] Save custom strategies to database
- [ ] Sync across devices
- [ ] Auto-save drafts while editing
- [ ] Cloud backup
- [ ] Offline mode with sync on reconnect

---

## Additional Feature Ideas

### Live Strategy Monitoring
- [ ] Real-time P&L updates for deployed strategies
- [ ] Push notifications for trade executions
- [ ] Alert when strategy hits drawdown limit
- [ ] Daily/weekly performance summaries via email

### Strategy Marketplace
- [ ] Sell/share custom strategies
- [ ] Rating and review system
- [ ] Verified performance badges
- [ ] Revenue sharing for strategy creators
- [ ] Free trial periods

### Advanced Backtesting
- [ ] Monte Carlo simulations
- [ ] Walk-forward optimization
- [ ] Out-of-sample testing
- [ ] Slippage and commission modeling
- [ ] Multiple timeframe analysis

### Risk Management
- [ ] Portfolio-level risk limits
- [ ] Correlation analysis between strategies
- [ ] VaR (Value at Risk) calculations
- [ ] Automatic position sizing based on Kelly criterion
- [ ] Circuit breakers for market conditions

### Social Features
- [ ] Follow top traders
- [ ] Copy trading (auto-follow strategies)
- [ ] Discussion forums per strategy
- [ ] Leaderboard for strategy creators
- [ ] Achievement badges

---

## Technical Debt / Improvements

### Performance
- [ ] Lazy load strategy templates
- [ ] Virtualized lists for large strategy collections
- [ ] Web workers for backtest calculations
- [ ] Service worker for offline caching

### Testing
- [ ] Unit tests for backtest calculations
- [ ] E2E tests for strategy builder flow
- [ ] Visual regression tests for charts
- [ ] Load testing for API endpoints

### Infrastructure
- [ ] Redis caching for market data
- [ ] PostgreSQL for strategy persistence
- [ ] WebSocket for real-time updates
- [ ] CDN for static assets

---

## Priority Order (Suggested)

1. **Persistence** - Most critical, users losing strategies on refresh
2. **Duplicate Strategy** - Quick win, high value
3. **Strategy Notes** - Low effort, helps users document decisions
4. **Export/Import** - Workaround for persistence, enables sharing
5. **Compare Backtests** - High value for iteration workflow
6. **Strategy Versioning** - Nice to have, builds on persistence

---

*Last updated: January 2025*
