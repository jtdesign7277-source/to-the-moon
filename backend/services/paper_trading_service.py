"""
Paper Trading Service for TO THE MOON
Handles simulated trading with virtual money against real market data.
"""
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from models import db, PaperPortfolio, PaperTrade, PaperPosition
from services.market_data_service import fetch_kalshi_markets, fetch_manifold_markets


class PaperTradingService:
    """Service for managing paper trading operations."""
    
    STARTING_BALANCE = 100000.0  # $100,000 starting balance
    
    @staticmethod
    def get_or_create_portfolio(user_id: str) -> PaperPortfolio:
        """Get existing portfolio or create a new one for the user."""
        portfolio = PaperPortfolio.query.filter_by(user_id=user_id).first()
        
        if not portfolio:
            portfolio = PaperPortfolio(
                user_id=user_id,
                starting_balance=PaperTradingService.STARTING_BALANCE,
                current_balance=PaperTradingService.STARTING_BALANCE,
                available_balance=PaperTradingService.STARTING_BALANCE,
                month_start_balance=PaperTradingService.STARTING_BALANCE,
            )
            db.session.add(portfolio)
            db.session.commit()
        
        return portfolio
    
    @staticmethod
    def get_portfolio(user_id: str) -> Optional[PaperPortfolio]:
        """Get user's paper trading portfolio."""
        return PaperPortfolio.query.filter_by(user_id=user_id).first()
    
    @staticmethod
    def reset_portfolio(user_id: str) -> PaperPortfolio:
        """Reset portfolio to starting balance and clear all trades."""
        portfolio = PaperPortfolio.query.filter_by(user_id=user_id).first()
        
        if portfolio:
            # Delete all trades and positions
            PaperTrade.query.filter_by(portfolio_id=portfolio.id).delete()
            PaperPosition.query.filter_by(portfolio_id=portfolio.id).delete()
            
            # Reset portfolio
            portfolio.current_balance = PaperTradingService.STARTING_BALANCE
            portfolio.available_balance = PaperTradingService.STARTING_BALANCE
            portfolio.total_pnl = 0.0
            portfolio.total_pnl_percent = 0.0
            portfolio.realized_pnl = 0.0
            portfolio.unrealized_pnl = 0.0
            portfolio.total_trades = 0
            portfolio.winning_trades = 0
            portfolio.losing_trades = 0
            portfolio.win_rate = 0.0
            portfolio.monthly_pnl = 0.0
            portfolio.monthly_pnl_percent = 0.0
            portfolio.month_start_balance = PaperTradingService.STARTING_BALANCE
            portfolio.last_trade_at = None
            portfolio.updated_at = datetime.utcnow()
        else:
            portfolio = PaperTradingService.get_or_create_portfolio(user_id)
        
        db.session.commit()
        return portfolio
    
    @staticmethod
    def get_market_price(platform: str, market_id: str) -> Optional[float]:
        """
        Get current market price for a specific market.
        Returns the YES price (probability).
        """
        try:
            if platform == 'kalshi':
                markets = fetch_kalshi_markets(limit=200)
                for market in markets:
                    if market.get('id') == market_id:
                        return market.get('yes_price', market.get('probability', 0.5))
            
            elif platform == 'manifold':
                markets = fetch_manifold_markets(limit=200)
                for market in markets:
                    if market.get('id') == market_id:
                        return market.get('yes_price', market.get('probability', 0.5))
            
            # Default mock price if market not found
            return 0.5
            
        except Exception as e:
            print(f"Error fetching market price: {e}")
            return 0.5
    
    @staticmethod
    def execute_trade(
        user_id: str,
        platform: str,
        market_id: str,
        market_title: str,
        side: str,  # 'yes' or 'no'
        action: str,  # 'buy' or 'sell'
        quantity: int,
        price: Optional[float] = None,
        strategy_id: Optional[str] = None
    ) -> Tuple[bool, str, Optional[PaperTrade]]:
        """
        Execute a paper trade.
        
        Args:
            user_id: The user's ID
            platform: Trading platform (kalshi, polymarket, manifold)
            market_id: The market identifier
            market_title: Human-readable market name
            side: 'yes' or 'no'
            action: 'buy' or 'sell'
            quantity: Number of contracts
            price: Optional price override (uses market price if not provided)
            strategy_id: Optional strategy that triggered this trade
            
        Returns:
            Tuple of (success, message, trade)
        """
        try:
            portfolio = PaperTradingService.get_or_create_portfolio(user_id)
            
            # Get market price if not provided
            if price is None:
                price = PaperTradingService.get_market_price(platform, market_id)
            
            # For NO side, price is inverse
            trade_price = price if side == 'yes' else (1 - price)
            
            # Calculate cost
            cost_basis = quantity * trade_price
            
            # Check if user has sufficient balance for buys
            if action == 'buy':
                if cost_basis > portfolio.available_balance:
                    return False, f"Insufficient balance. Need ${cost_basis:.2f}, have ${portfolio.available_balance:.2f}", None
                
                # Deduct from available balance
                portfolio.available_balance -= cost_basis
            
            # Create the trade record
            trade = PaperTrade(
                portfolio_id=portfolio.id,
                user_id=user_id,
                strategy_id=strategy_id,
                platform=platform,
                market_id=market_id,
                market_title=market_title,
                side=side,
                action=action,
                quantity=quantity,
                entry_price=trade_price,
                cost_basis=cost_basis,
                current_value=cost_basis,  # Initially same as cost
                status='open',
            )
            db.session.add(trade)
            
            # Update or create position
            if action == 'buy':
                PaperTradingService._update_position_on_buy(
                    portfolio, platform, market_id, market_title, side, quantity, trade_price
                )
            else:  # sell
                PaperTradingService._update_position_on_sell(
                    portfolio, platform, market_id, side, quantity, trade_price, trade
                )
            
            # Update portfolio stats
            portfolio.total_trades += 1
            portfolio.last_trade_at = datetime.utcnow()
            portfolio.update_stats()
            
            db.session.commit()
            
            return True, f"Trade executed: {action.upper()} {quantity} {side.upper()} @ ${trade_price:.2f}", trade
            
        except Exception as e:
            db.session.rollback()
            return False, f"Trade failed: {str(e)}", None
    
    @staticmethod
    def _update_position_on_buy(
        portfolio: PaperPortfolio,
        platform: str,
        market_id: str,
        market_title: str,
        side: str,
        quantity: int,
        price: float
    ):
        """Update or create position after a buy."""
        position = PaperPosition.query.filter_by(
            portfolio_id=portfolio.id,
            market_id=market_id,
            side=side
        ).first()
        
        if position:
            # Average in the new position
            total_cost = position.cost_basis + (quantity * price)
            total_quantity = position.quantity + quantity
            position.avg_entry_price = total_cost / total_quantity
            position.quantity = total_quantity
            position.cost_basis = total_cost
            position.current_value = total_cost
        else:
            # Create new position
            position = PaperPosition(
                portfolio_id=portfolio.id,
                user_id=portfolio.user_id,
                platform=platform,
                market_id=market_id,
                market_title=market_title,
                side=side,
                quantity=quantity,
                avg_entry_price=price,
                current_price=price,
                cost_basis=quantity * price,
                current_value=quantity * price,
            )
            db.session.add(position)
    
    @staticmethod
    def _update_position_on_sell(
        portfolio: PaperPortfolio,
        platform: str,
        market_id: str,
        side: str,
        quantity: int,
        price: float,
        trade: PaperTrade
    ):
        """Update position and realize P&L after a sell."""
        position = PaperPosition.query.filter_by(
            portfolio_id=portfolio.id,
            market_id=market_id,
            side=side
        ).first()
        
        if not position or position.quantity < quantity:
            raise ValueError("Insufficient position to sell")
        
        # Calculate realized P&L for this sale
        sale_proceeds = quantity * price
        cost_portion = quantity * position.avg_entry_price
        realized_pnl = sale_proceeds - cost_portion
        
        # Update trade with P&L
        trade.close_trade(price)
        trade.pnl = realized_pnl
        
        # Update portfolio
        portfolio.realized_pnl += realized_pnl
        portfolio.available_balance += sale_proceeds
        portfolio.current_balance = portfolio.available_balance + PaperTradingService._calculate_positions_value(portfolio)
        
        if realized_pnl > 0:
            portfolio.winning_trades += 1
        elif realized_pnl < 0:
            portfolio.losing_trades += 1
        
        # Update position
        position.quantity -= quantity
        position.cost_basis -= cost_portion
        
        if position.quantity <= 0:
            db.session.delete(position)
        else:
            position.current_value = position.quantity * position.current_price
    
    @staticmethod
    def _calculate_positions_value(portfolio: PaperPortfolio) -> float:
        """Calculate total value of all open positions."""
        positions = PaperPosition.query.filter_by(portfolio_id=portfolio.id).all()
        return sum(p.current_value or p.cost_basis for p in positions)
    
    @staticmethod
    def update_positions_prices(user_id: str) -> PaperPortfolio:
        """Update all position prices with current market data."""
        portfolio = PaperTradingService.get_portfolio(user_id)
        if not portfolio:
            return None
        
        positions = PaperPosition.query.filter_by(portfolio_id=portfolio.id).all()
        total_unrealized = 0.0
        
        for position in positions:
            new_price = PaperTradingService.get_market_price(position.platform, position.market_id)
            if new_price:
                # Adjust for side
                if position.side == 'no':
                    new_price = 1 - new_price
                position.update_price(new_price)
                total_unrealized += position.unrealized_pnl
        
        # Update portfolio unrealized P&L
        portfolio.unrealized_pnl = total_unrealized
        positions_value = PaperTradingService._calculate_positions_value(portfolio)
        portfolio.current_balance = portfolio.available_balance + positions_value
        portfolio.update_stats()
        
        db.session.commit()
        return portfolio
    
    @staticmethod
    def get_open_positions(user_id: str) -> List[Dict]:
        """Get all open positions for a user."""
        portfolio = PaperTradingService.get_portfolio(user_id)
        if not portfolio:
            return []
        
        positions = PaperPosition.query.filter_by(portfolio_id=portfolio.id).all()
        return [p.to_dict() for p in positions]
    
    @staticmethod
    def get_trade_history(user_id: str, limit: int = 50) -> List[Dict]:
        """Get trade history for a user."""
        portfolio = PaperTradingService.get_portfolio(user_id)
        if not portfolio:
            return []
        
        trades = PaperTrade.query.filter_by(portfolio_id=portfolio.id)\
            .order_by(PaperTrade.opened_at.desc())\
            .limit(limit)\
            .all()
        
        return [t.to_dict() for t in trades]
    
    @staticmethod
    def close_position(user_id: str, position_id: str) -> Tuple[bool, str]:
        """Close an open position at current market price."""
        position = PaperPosition.query.filter_by(id=position_id, user_id=user_id).first()
        
        if not position:
            return False, "Position not found"
        
        # Get current price
        current_price = PaperTradingService.get_market_price(position.platform, position.market_id)
        if position.side == 'no':
            current_price = 1 - current_price
        
        # Execute sell trade
        success, message, trade = PaperTradingService.execute_trade(
            user_id=user_id,
            platform=position.platform,
            market_id=position.market_id,
            market_title=position.market_title,
            side=position.side,
            action='sell',
            quantity=position.quantity,
            price=current_price,
        )
        
        return success, message
    
    @staticmethod
    def get_portfolio_summary(user_id: str) -> Dict:
        """Get a complete portfolio summary for the user."""
        portfolio = PaperTradingService.get_or_create_portfolio(user_id)
        
        # Update prices before returning
        PaperTradingService.update_positions_prices(user_id)
        
        # Refresh portfolio
        db.session.refresh(portfolio)
        
        return {
            'portfolio': portfolio.to_dict(),
            'positions': PaperTradingService.get_open_positions(user_id),
            'recentTrades': PaperTradingService.get_trade_history(user_id, limit=10),
        }


# Singleton instance
paper_trading_service = PaperTradingService()
