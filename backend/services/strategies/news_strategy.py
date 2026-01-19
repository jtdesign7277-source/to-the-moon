"""
News-Based Strategy Implementation
Reacts to news events and sentiment changes
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import logging
import re

from .base_strategy import (
    BaseStrategy,
    StrategyConfig,
    Signal,
    SignalType,
    PositionSide,
    Position,
)

logger = logging.getLogger(__name__)


class NewsStrategy(BaseStrategy):
    """
    News-based strategy that reacts to news events and sentiment.

    How it works:
    1. Monitors news feeds and social media for relevant events
    2. Analyzes sentiment and relevance to prediction markets
    3. Detects significant events (debates, announcements, data releases)
    4. Generates signals based on expected market impact

    Key features:
    - Event detection and classification
    - Sentiment analysis
    - Speed of execution (first-mover advantage)
    - Keyword and topic matching
    """

    @property
    def strategy_type(self) -> str:
        return "news-based"

    def __init__(self, config: StrategyConfig):
        super().__init__(config)

        # News strategy specific settings
        self.sentiment_threshold = config.custom_settings.get('sentiment_threshold', 0.6)
        self.relevance_threshold = config.custom_settings.get('relevance_threshold', 0.5)
        self.react_speed = config.custom_settings.get('react_speed', 'fast')  # fast, medium, slow
        self.event_types = config.custom_settings.get('event_types', [
            'political', 'economic', 'earnings', 'fed', 'election'
        ])

        # Event keywords for different categories
        self.keywords = {
            'political': [
                'election', 'poll', 'debate', 'candidate', 'vote', 'president',
                'congress', 'senate', 'endorsement', 'campaign', 'primary'
            ],
            'economic': [
                'fed', 'interest rate', 'inflation', 'gdp', 'jobs', 'unemployment',
                'cpi', 'fomc', 'powell', 'recession', 'treasury', 'yield'
            ],
            'crypto': [
                'bitcoin', 'ethereum', 'btc', 'eth', 'sec', 'etf', 'halving',
                'regulation', 'exchange', 'defi', 'nft'
            ],
            'sports': [
                'injury', 'trade', 'lineup', 'coach', 'suspension', 'weather',
                'playoff', 'championship', 'odds'
            ],
        }

        # Sentiment indicators
        self.positive_words = [
            'surge', 'win', 'gain', 'positive', 'bullish', 'rally', 'support',
            'approval', 'success', 'beat', 'exceed', 'strong', 'growth'
        ]
        self.negative_words = [
            'drop', 'fall', 'decline', 'negative', 'bearish', 'crash', 'lose',
            'disapproval', 'fail', 'miss', 'weak', 'recession', 'crisis'
        ]

        # Recent events cache
        self.recent_events: deque = deque(maxlen=100)

        # Market impact tracking
        self.market_impacts: Dict[str, List[Dict]] = {}

    def analyze(self, market_data: Dict[str, Any]) -> List[Signal]:
        """
        Analyze news events and generate trading signals.

        Args:
            market_data: Dict containing:
                - news_events: List of news items
                - markets: List of relevant markets
                - social_sentiment: Optional social media sentiment

        Returns:
            List of news-based signals
        """
        signals = []

        news_events = market_data.get('news_events', [])
        markets = market_data.get('markets', [])
        social_sentiment = market_data.get('social_sentiment', {})

        for event in news_events:
            # Analyze the event
            event_analysis = self._analyze_event(event)

            if not event_analysis:
                continue

            # Check if event is relevant enough
            if event_analysis['relevance'] < self.relevance_threshold:
                continue

            # Find related markets
            related_markets = self._find_related_markets(event_analysis, markets)

            for market in related_markets:
                # Check liquidity
                volume = market.get('volume', 0)
                if volume < self.config.min_liquidity:
                    continue

                # Generate signal
                signal = self._generate_news_signal(event_analysis, market, social_sentiment)

                if signal:
                    signals.append(signal)

        # Sort by urgency and relevance
        signals.sort(
            key=lambda s: (
                s.metadata.get('urgency', 0) * 0.4 +
                s.confidence * 0.6
            ),
            reverse=True
        )

        self.signals = signals
        self.last_update = datetime.utcnow()

        return signals

    def _analyze_event(self, event: Dict) -> Optional[Dict]:
        """
        Analyze a news event for trading relevance.

        Returns dict with:
        - title: Event title
        - category: Event category
        - sentiment: -1 to 1 sentiment score
        - relevance: 0 to 1 relevance score
        - keywords_matched: List of matched keywords
        - urgency: 0 to 1 urgency score
        """
        title = event.get('title', '').lower()
        content = event.get('content', '').lower()
        full_text = f"{title} {content}"

        if not full_text.strip():
            return None

        # Determine category and relevance
        category = None
        max_keyword_matches = 0
        matched_keywords = []

        for cat, keywords in self.keywords.items():
            matches = [kw for kw in keywords if kw in full_text]
            if len(matches) > max_keyword_matches:
                max_keyword_matches = len(matches)
                category = cat
                matched_keywords = matches

        if not category:
            return None

        # Calculate relevance score
        relevance = min(len(matched_keywords) / 3, 1.0)

        # Calculate sentiment
        positive_count = sum(1 for word in self.positive_words if word in full_text)
        negative_count = sum(1 for word in self.negative_words if word in full_text)

        total_sentiment_words = positive_count + negative_count
        if total_sentiment_words > 0:
            sentiment = (positive_count - negative_count) / total_sentiment_words
        else:
            sentiment = 0

        # Calculate urgency based on recency and keywords
        urgency = 0.5  # Base urgency

        # Urgent keywords
        urgent_words = ['breaking', 'just', 'now', 'immediate', 'surprise', 'unexpected']
        if any(word in full_text for word in urgent_words):
            urgency = 0.9

        # Check event time
        event_time = event.get('timestamp')
        if event_time:
            try:
                if isinstance(event_time, str):
                    event_dt = datetime.fromisoformat(event_time.replace('Z', '+00:00'))
                else:
                    event_dt = datetime.fromtimestamp(event_time)

                age_minutes = (datetime.utcnow() - event_dt).total_seconds() / 60

                if age_minutes < 5:
                    urgency = 1.0
                elif age_minutes < 30:
                    urgency = max(urgency, 0.8)
                elif age_minutes < 60:
                    urgency = max(urgency, 0.6)
                else:
                    urgency *= 0.5  # Old news, reduce urgency
            except Exception:
                pass

        return {
            'title': event.get('title', ''),
            'content': event.get('content', ''),
            'category': category,
            'sentiment': sentiment,
            'relevance': relevance,
            'keywords_matched': matched_keywords,
            'urgency': urgency,
            'source': event.get('source', 'unknown'),
            'timestamp': event.get('timestamp'),
        }

    def _find_related_markets(self, event_analysis: Dict, markets: List[Dict]) -> List[Dict]:
        """Find markets related to the news event"""
        related = []
        category = event_analysis['category']
        keywords = event_analysis['keywords_matched']

        for market in markets:
            market_title = market.get('title', '').lower()
            market_category = market.get('category', '').lower()

            # Check category match
            if category in market_category:
                related.append(market)
                continue

            # Check keyword match
            if any(kw in market_title for kw in keywords):
                related.append(market)
                continue

        return related

    def _generate_news_signal(
        self,
        event_analysis: Dict,
        market: Dict,
        social_sentiment: Dict
    ) -> Optional[Signal]:
        """Generate a trading signal based on news event"""
        sentiment = event_analysis['sentiment']
        relevance = event_analysis['relevance']
        urgency = event_analysis['urgency']

        # Check sentiment threshold
        if abs(sentiment) < self.sentiment_threshold:
            return None

        # Get additional social sentiment if available
        market_id = market.get('id', '')
        social_score = social_sentiment.get(market_id, 0)

        # Combined sentiment
        combined_sentiment = sentiment * 0.7 + social_score * 0.3

        # Calculate expected price impact
        current_price = market.get('yes_price') or market.get('probability', 0.5)

        # Estimate impact based on sentiment and relevance
        expected_impact = combined_sentiment * relevance * 0.15  # Max 15% impact

        # Calculate edge
        edge = abs(expected_impact) * 100
        if edge < self.config.min_edge:
            return None

        # Determine direction
        if combined_sentiment > 0:
            side = PositionSide.LONG
            signal_type = SignalType.BUY
        else:
            side = PositionSide.SHORT
            signal_type = SignalType.SELL

        # Calculate confidence
        confidence = min(
            abs(combined_sentiment) * 0.4 +
            relevance * 0.3 +
            urgency * 0.3,
            1.0
        )

        # Size recommendation (higher for urgent, high-confidence signals)
        size_rec = min(edge / 20, 1.0) * confidence * urgency

        return Signal(
            signal_type=signal_type,
            market_id=market.get('id'),
            platform=market.get('platform', 'kalshi'),
            confidence=confidence,
            price=current_price,
            side=side,
            size_recommendation=size_rec,
            reason=f"News: {event_analysis['title'][:50]}... Sentiment: {combined_sentiment:+.2f}, "
                   f"Keywords: {', '.join(event_analysis['keywords_matched'][:3])}",
            metadata={
                'event_title': event_analysis['title'],
                'event_category': event_analysis['category'],
                'sentiment': sentiment,
                'social_sentiment': social_score,
                'combined_sentiment': combined_sentiment,
                'relevance': relevance,
                'urgency': urgency,
                'keywords': event_analysis['keywords_matched'],
                'expected_impact': expected_impact,
                'edge': edge,
            }
        )

    def should_enter(self, signal: Signal, market_data: Dict[str, Any]) -> bool:
        """
        Determine if we should enter a news-driven position.

        News strategy emphasizes speed, so fewer checks.
        """
        # Check position limits
        if len(self.positions) >= 5:
            return False

        # Check we don't already have position in this market
        for pos in self.positions.values():
            if pos.market_id == signal.market_id:
                return False

        # For news, urgency matters - enter quickly if confidence is high
        if signal.confidence > 0.7 and signal.metadata.get('urgency', 0) > 0.7:
            return True

        # Otherwise, standard checks
        if signal.confidence < 0.5:
            return False

        return True

    def should_exit(self, position: Position, market_data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if we should exit a news-driven position.

        News impact fades over time, so time-based exits are important.
        """
        # Check standard exit conditions first
        should_exit, reason = self.check_exit_conditions(position, market_data)
        if should_exit:
            return True, reason

        # News impact typically fades - exit after certain time
        hours_in_trade = (datetime.utcnow() - position.entry_time).total_seconds() / 3600

        # Quick trades for news - exit if not profitable after 2 hours
        if hours_in_trade > 2:
            pnl_percent = position.get_pnl_percent()
            if pnl_percent < 0:
                return True, f"News impact faded, cutting losses at {pnl_percent:.1f}%"

        # Exit after 6 hours regardless (news is stale)
        if hours_in_trade > 6:
            return True, "News trade expired (6 hour max)"

        # Check if contrary news emerged
        contrary_events = market_data.get('contrary_events', [])
        if contrary_events:
            return True, "Contrary news detected"

        return False, ""

    def process_news_feed(self, news_items: List[Dict]) -> List[Dict]:
        """
        Process a batch of news items and return analyzed events.

        Useful for batch processing of news feeds.
        """
        analyzed_events = []

        for item in news_items:
            analysis = self._analyze_event(item)
            if analysis:
                analyzed_events.append(analysis)

        # Sort by relevance and urgency
        analyzed_events.sort(
            key=lambda x: x['relevance'] * x['urgency'],
            reverse=True
        )

        return analyzed_events

    def get_news_status(self) -> Dict:
        """Get news strategy specific status"""
        status = self.get_status()

        status.update({
            'recent_events': list(self.recent_events)[-10:],
            'event_types': self.event_types,
            'sentiment_threshold': self.sentiment_threshold,
            'relevance_threshold': self.relevance_threshold,
            'react_speed': self.react_speed,
        })

        return status
