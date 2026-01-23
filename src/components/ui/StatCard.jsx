import { cn } from '../../lib/utils'
import { PriceChange } from './PriceChange'

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend,
  size = 'md',
  className
}) {
  const sizeClasses = {
    sm: {
      container: 'p-3',
      label: 'text-xs',
      value: 'text-lg',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'p-4',
      label: 'text-xs',
      value: 'text-xl',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'p-5',
      label: 'text-sm',
      value: 'text-2xl',
      icon: 'w-6 h-6',
    },
  }

  const styles = sizeClasses[size]

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-card',
        styles.container,
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={cn('text-gray-500 font-medium', styles.label)}>
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 bg-gray-50 rounded-lg">
            <Icon className={cn('text-gray-400', styles.icon)} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className={cn('font-semibold text-gray-900 font-numbers', styles.value)}>
          {value}
        </span>
        {typeof change === 'number' && (
          <PriceChange value={change} size="sm" />
        )}
        {trend && (
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            trend === 'up' && 'bg-gain-light text-gain',
            trend === 'down' && 'bg-loss-light text-loss',
            trend === 'neutral' && 'bg-gray-100 text-gray-600'
          )}>
            {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Flat'}
          </span>
        )}
      </div>
    </div>
  )
}

export function StatCardRow({ children, className }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {children}
    </div>
  )
}
