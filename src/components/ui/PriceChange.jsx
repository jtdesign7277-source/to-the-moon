import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

export function PriceChange({
  value,
  showIcon = true,
  showSign = true,
  size = 'md',
  className
}) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-medium',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const formattedValue = Math.abs(value).toFixed(2)
  const sign = showSign && isPositive ? '+' : ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-numbers',
        sizeClasses[size],
        isPositive && 'text-gain',
        isNegative && 'text-loss',
        isNeutral && 'text-gray-500',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{sign}{formattedValue}%</span>
    </span>
  )
}

export function PriceValue({
  value,
  previousValue,
  currency = true,
  size = 'md',
  className
}) {
  const change = previousValue ? value - previousValue : 0
  const isUp = change > 0
  const isDown = change < 0

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-semibold',
    xl: 'text-3xl font-bold',
  }

  const formattedValue = currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    : value.toLocaleString()

  return (
    <span
      className={cn(
        'font-numbers transition-colors duration-300',
        sizeClasses[size],
        isUp && 'text-gain',
        isDown && 'text-loss',
        !isUp && !isDown && 'text-gray-900',
        className
      )}
    >
      {formattedValue}
    </span>
  )
}
