import { motion } from 'framer-motion'

/**
 * StatCard - Enhanced stat card with animations and better interactions
 */
export const StatCard = ({
  label,
  value,
  change,
  icon: Icon,
  color = 'indigo',
  isPositive = true,
  onClick,
  loading = false,
  detail,
  delay = 0,
}) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  const borderColors = {
    green: 'border-green-200 hover:border-green-300',
    red: 'border-red-200 hover:border-red-300',
    indigo: 'border-indigo-200 hover:border-indigo-300',
    purple: 'border-purple-200 hover:border-purple-300',
    blue: 'border-blue-200 hover:border-blue-300',
    amber: 'border-amber-200 hover:border-amber-300',
  }

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.4,
      },
    },
    hover: {
      y: -4,
      transition: { duration: 0.2 },
    },
  }

  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="show"
      whileHover="hover"
      transition={{ delay }}
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border ${borderColors[color]} cursor-pointer transition-all will-change-transform ${
        onClick ? 'hover:shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</p>
            {detail && (
              <p className="text-[10px] text-gray-500 mt-0.5">{detail}</p>
            )}
          </div>
          {Icon && (
            <motion.div
              className={`p-2.5 rounded-xl ${colorClasses[color]} shrink-0`}
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline justify-between">
            <motion.span
              className="text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.2 }}
            >
              {value}
            </motion.span>
            {change && (
              <motion.span
                className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
              >
                {change}
              </motion.span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * InteractiveCard - General purpose card with hover effects
 */
export const InteractiveCard = ({
  children,
  onClick,
  className = '',
  animated = true,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg',
    elevated: 'bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl',
    outlined: 'bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-300',
    subtle: 'bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200',
  }

  const content = (
    <motion.div
      whileHover={animated ? { y: -2 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`${variantClasses[variant]} transition-all ${className}`}
    >
      {children}
    </motion.div>
  )

  if (onClick) {
    return (
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className="w-full text-left"
      >
        {content}
      </motion.button>
    )
  }

  return content
}

/**
 * GradientCard - Card with animated gradient background
 */
export const GradientCard = ({
  children,
  gradientFrom = 'from-indigo-500',
  gradientTo = 'to-purple-600',
  onClick,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`relative rounded-xl p-6 text-white bg-gradient-to-r ${gradientFrom} ${gradientTo} shadow-lg overflow-hidden cursor-pointer group`}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
    </div>

    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
)

/**
 * DataCard - For displaying key metrics with animations
 */
export const DataCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendColor = 'green',
  onClick,
}) => (
  <InteractiveCard onClick={onClick}>
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.15, rotate: 10 }}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <Icon className="w-4 h-4 text-gray-600" />
          </motion.div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <motion.span
          className="text-2xl font-bold text-gray-900"
          layoutId={`data-card-value-${title}`}
        >
          {value}
        </motion.span>
        {trend && (
          <motion.span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trendColor === 'green'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {trend}
          </motion.span>
        )}
      </div>
    </div>
  </InteractiveCard>
)

export default {
  StatCard,
  InteractiveCard,
  GradientCard,
  DataCard,
}