import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const MarketplaceContext = createContext(null)

export function MarketplaceProvider({ children }) {
  // User's marketplace listings
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_my_listings')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // All marketplace listings (would come from backend in production)
  const [allListings, setAllListings] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_marketplace_listings')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Purchased strategies
  const [purchasedStrategies, setPurchasedStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('ttm_purchased_strategies')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ttm_my_listings', JSON.stringify(myListings))
  }, [myListings])

  useEffect(() => {
    localStorage.setItem('ttm_marketplace_listings', JSON.stringify(allListings))
  }, [allListings])

  useEffect(() => {
    localStorage.setItem('ttm_purchased_strategies', JSON.stringify(purchasedStrategies))
  }, [purchasedStrategies])

  // List a strategy on the marketplace
  const listStrategy = useCallback((strategy, listingData) => {
    const listing = {
      id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol: strategy.symbol || 'SPY',
      description: listingData.description || '',
      price: listingData.price,
      priceType: listingData.priceType || 'one-time', // 'one-time' | 'monthly'
      backtestResults: strategy.backtestResults || null,
      // Seller info
      sellerId: 'current-user', // Would be real user ID
      sellerName: listingData.sellerName || 'Anonymous',
      sellerRating: 4.5, // Would come from user profile
      // Stats
      views: 0,
      purchases: 0,
      rating: 0,
      reviews: [],
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active', // 'active' | 'paused' | 'sold'
      // Strategy details for preview
      indicators: strategy.indicators || [],
      entryCondition: strategy.entryCondition || '',
      exitCondition: strategy.exitCondition || '',
    }

    setMyListings(prev => [listing, ...prev])
    setAllListings(prev => [listing, ...prev])

    return listing
  }, [])

  // Update a listing
  const updateListing = useCallback((listingId, updates) => {
    const updateFn = prev => prev.map(listing => {
      if (listing.id === listingId) {
        return { ...listing, ...updates, updatedAt: new Date().toISOString() }
      }
      return listing
    })

    setMyListings(updateFn)
    setAllListings(updateFn)
  }, [])

  // Remove a listing
  const removeListing = useCallback((listingId) => {
    setMyListings(prev => prev.filter(l => l.id !== listingId))
    setAllListings(prev => prev.filter(l => l.id !== listingId))
  }, [])

  // Pause/unpause a listing
  const toggleListingStatus = useCallback((listingId) => {
    const updateFn = prev => prev.map(listing => {
      if (listing.id === listingId) {
        return {
          ...listing,
          status: listing.status === 'active' ? 'paused' : 'active',
          updatedAt: new Date().toISOString()
        }
      }
      return listing
    })

    setMyListings(updateFn)
    setAllListings(updateFn)
  }, [])

  // Purchase a strategy (buyer side)
  const purchaseStrategy = useCallback((listing, buyerCoins) => {
    if (buyerCoins < listing.price) {
      return { success: false, error: 'Insufficient coins' }
    }

    // Add to purchased strategies
    const purchase = {
      id: `purchase-${Date.now()}`,
      listingId: listing.id,
      strategyName: listing.strategyName,
      symbol: listing.symbol,
      price: listing.price,
      purchasedAt: new Date().toISOString(),
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      // Copy strategy details
      indicators: listing.indicators,
      entryCondition: listing.entryCondition,
      exitCondition: listing.exitCondition,
      backtestResults: listing.backtestResults,
    }

    setPurchasedStrategies(prev => [purchase, ...prev])

    // Update listing stats
    updateListing(listing.id, { purchases: listing.purchases + 1 })

    return { success: true, purchase }
  }, [updateListing])

  // Record a view
  const recordView = useCallback((listingId) => {
    setAllListings(prev => prev.map(listing => {
      if (listing.id === listingId) {
        return { ...listing, views: listing.views + 1 }
      }
      return listing
    }))
  }, [])

  // Add a review
  const addReview = useCallback((listingId, review) => {
    const updateFn = prev => prev.map(listing => {
      if (listing.id === listingId) {
        const newReviews = [...listing.reviews, {
          id: `review-${Date.now()}`,
          rating: review.rating,
          comment: review.comment,
          userId: 'current-user',
          userName: review.userName || 'Anonymous',
          createdAt: new Date().toISOString(),
        }]
        const avgRating = newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length
        return { ...listing, reviews: newReviews, rating: avgRating }
      }
      return listing
    })

    setMyListings(updateFn)
    setAllListings(updateFn)
  }, [])

  // Get listing by ID
  const getListing = useCallback((listingId) => {
    return allListings.find(l => l.id === listingId)
  }, [allListings])

  // Check if strategy is already listed
  const isStrategyListed = useCallback((strategyId) => {
    return myListings.some(l => l.strategyId === strategyId && l.status !== 'removed')
  }, [myListings])

  // Get my active listings count
  const activeListingsCount = myListings.filter(l => l.status === 'active').length

  // Get total earnings (simplified)
  const totalEarnings = myListings.reduce((sum, listing) => {
    return sum + (listing.purchases * listing.price)
  }, 0)

  const value = {
    // State
    myListings,
    allListings,
    purchasedStrategies,
    activeListingsCount,
    totalEarnings,

    // Actions
    listStrategy,
    updateListing,
    removeListing,
    toggleListingStatus,
    purchaseStrategy,
    recordView,
    addReview,
    getListing,
    isStrategyListed,
  }

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  )
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider')
  }
  return context
}

export default MarketplaceContext
