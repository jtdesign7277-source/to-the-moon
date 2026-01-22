import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * PageTransition - Wraps page content with smooth enter/exit animations
 * Usage: <PageTransition key={page}><YourPage /></PageTransition>
 */
export const PageTransition = ({ children, variant = 'fade' }) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },
    slideUp: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 },
      transition: { duration: 0.3 },
    },
    slideRight: {
      initial: { opacity: 0, x: -40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 40 },
      transition: { duration: 0.3 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.3 },
    },
  }

  const selectedVariant = variants[variant] || variants.fade

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={selectedVariant.transition}
    >
      {children}
    </motion.div>
  )
}

/**
 * LayoutAnimationContainer - Wraps multiple pages with AnimatePresence
 * Usage: <LayoutAnimationContainer>{currentPage}</LayoutAnimationContainer>
 */
export const LayoutAnimationContainer = ({ children, mode = 'wait' }) => {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  )
}

/**
 * Stack animations for staggered element entry
 */
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

/**
 * StatCard entrance with slight delay and pop effect
 */
export const statCardVariants = {
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

/**
 * Modal entrance with backdrop
 */
export const modalVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, type: 'spring', stiffness: 120 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

/**
 * Sidebar slide animation
 */
export const sidebarVariants = {
  closed: {
    x: -280,
    opacity: 0,
    transition: { duration: 0.2 },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

/**
 * Button press feedback
 */
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

/**
 * Loading skeleton pulse
 */
export const skeletonVariants = {
  initial: { opacity: 0.6 },
  animate: { opacity: 1 },
  transition: {
    repeat: Infinity,
    repeatType: 'reverse',
    duration: 1.5,
  },
}

/**
 * Tooltip slide-in
 */
export const tooltipVariants = {
  hidden: { opacity: 0, scale: 0.8, y: -10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15 } },
}

/**
 * List item stagger
 */
export const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
}

export const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 },
  },
}

export default PageTransition