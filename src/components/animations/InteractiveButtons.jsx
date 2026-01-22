import { motion } from 'framer-motion'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

/**
 * PrimaryButton - Main action button with animations
 */
export const PrimaryButton = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  icon: Icon,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        relative font-medium rounded-lg
        bg-gradient-to-r from-indigo-500 to-indigo-600
        text-white
        transition-all duration-200
        hover:shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-4 h-4" />
        </motion.div>
      ) : Icon ? (
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
      ) : null}
      {children}
    </motion.button>
  )
}

/**
 * SecondaryButton - Secondary action button
 */
export const SecondaryButton = ({
  children,
  onClick,
  icon: Icon,
  size = 'md',
  fullWidth = false,
  variant = 'outline',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    soft: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${variantClasses[variant]}
        font-medium rounded-lg
        transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  )
}

/**
 * DangerButton - For destructive actions
 */
export const DangerButton = ({
  children,
  onClick,
  icon: Icon,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium rounded-lg
        bg-gradient-to-r from-red-500 to-red-600
        text-white
        transition-all duration-200
        hover:shadow-lg
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  )
}

/**
 * SuccessButton - For successful/confirmed actions
 */
export const SuccessButton = ({
  children,
  onClick,
  showCheck = false,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium rounded-lg
        bg-gradient-to-r from-green-500 to-emerald-600
        text-white
        transition-all duration-200
        hover:shadow-lg
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {showCheck ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
      ) : null}
      {children}
    </motion.button>
  )
}

/**
 * IconButton - Small icon-only button
 */
export const IconButton = ({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  tooltip,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const variantClasses = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-600',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  const sizeClasses = {
    sm: 'p-2 w-8 h-8',
    md: 'p-2.5 w-10 h-10',
    lg: 'p-3 w-12 h-12',
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-lg transition-colors flex items-center justify-center
          ${className}
        `}
      >
        <Icon className="w-5 h-5" />
      </motion.button>

      {tooltip && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.9 }}
          animate={{ opacity: 1, y: 10, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.9 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap"
        >
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </motion.div>
      )}
    </div>
  )
}

/**
 * ToggleButton - For toggle/switch actions
 */
export const ToggleButton = ({
  isActive,
  onChange,
  activeLabel = 'On',
  inactiveLabel = 'Off',
  icon: Icon,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  }

  return (
    <motion.button
      onClick={() => onChange(!isActive)}
      className={`
        ${sizeClasses[size]}
        font-medium rounded-lg transition-all
        flex items-center justify-center gap-2
        ${isActive
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {Icon && (
        <motion.div
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
      )}
      {isActive ? activeLabel : inactiveLabel}
    </motion.button>
  )
}

/**
 * FloatingActionButton - Large action button for important actions
 */
export const FloatingActionButton = ({
  icon: Icon,
  onClick,
  color = 'indigo',
  label,
  className = '',
}) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-violet-600',
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed bottom-6 right-6 p-4 rounded-full
        bg-gradient-to-r ${colorClasses[color]}
        text-white shadow-lg
        flex items-center justify-center gap-2
        group hover:shadow-2xl
        transition-all duration-300
        z-40
        ${className}
      `}
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: 10 }}
      >
        <Icon className="w-6 h-6" />
      </motion.div>

      {label && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="font-medium text-sm"
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  )
}

export default {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SuccessButton,
  IconButton,
  ToggleButton,
  FloatingActionButton,
}