# Font & Styling Reference Guide

## Reference Image
Save the positions card screenshot as `positions-card-reference.png` in this folder.

---

## Standard Card Item Layout

### Symbol/Ticker Name
- **Class**: `text-lg font-bold text-gray-900 dark:text-white`
- **Size**: Large (text-lg = 18px)
- **Weight**: Bold

### Quantity/Subtitle
- **Class**: `text-sm text-gray-500 dark:text-gray-400`
- **Size**: Small (text-sm = 14px)
- **Color**: Gray 500

### Strategy Name
- **Class**: `text-sm text-green-500 font-medium`
- **Size**: Small (text-sm = 14px)
- **Color**: Green 500
- **Weight**: Medium

### Status Labels (Open, Closed, etc.)
- **Class**: `text-sm text-gray-400 dark:text-gray-500`
- **Size**: Small (text-sm = 14px)
- **Color**: Gray 400/500

### Entry/Current Price Labels
- **Class**: `text-sm text-gray-500 dark:text-gray-400`
- **Size**: Small (text-sm = 14px)
- **Color**: Gray 500

---

## P&L Values

### Large P&L (Primary Display)
- **Class**: `text-xl font-bold text-green-500` (positive) or `text-red-500` (negative)
- **Size**: Extra Large (text-xl = 20px)
- **Weight**: Bold
- **Color**: Green 500 / Red 500

### Header P&L
- **Class**: `text-xl font-bold text-green-500` or `text-red-500`
- Same as large P&L

### Total P&L Summary
- **Class**: `text-xl font-bold text-green-500` or `text-red-500`
- Same as large P&L

---

## Labels & Badges

### BUY/SELL Labels
- **Class**: `text-xs font-bold text-green-500` (BUY) or `text-red-500` (SELL)
- **Size**: Extra Small (text-xs = 12px)
- **Weight**: Bold
- **NO background** - plain text only

### YES/NO Position Labels
- **Class**: `text-xs font-bold text-green-500` (YES) or `text-red-500` (NO)
- **Size**: Extra Small (text-xs = 12px)
- **Weight**: Bold
- **NO background** - plain text only

### WIN/LOSS Labels
- **Class**: `text-xs font-bold text-green-500` (WIN) or `text-red-500` (LOSS)
- **Size**: Extra Small (text-xs = 12px)
- **Weight**: Bold
- **NO background** - plain text only

---

## Card Headers

### Card Title
- **Class**: `text-lg font-bold text-gray-900 dark:text-white`
- **Size**: Large (text-lg = 18px)
- **Weight**: Bold

### Card Subtitle
- **Class**: `text-sm text-gray-500 dark:text-gray-400`
- **Size**: Small (text-sm = 14px)

### Icon Box
- **Class**: `p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-xl`
- **Padding**: 2.5 (10px)
- **Border Radius**: xl (12px)

---

## Status Indicators

### Pulse Dot (Live)
- **Class**: `w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse`
- **Size**: 10px x 10px

---

## Spacing

### Card Item Padding
- **Class**: `px-4 py-4`
- **Horizontal**: 16px
- **Vertical**: 16px

### Gap Between Elements
- **Icons to Content**: `gap-3` (12px)
- **Right-side elements**: `gap-4` (16px)

---

## Colors Reference

### Profit/Positive
- `text-green-500` (#22c55e)

### Loss/Negative
- `text-red-500` (#ef4444)

### Primary Text (Dark Mode)
- `text-gray-900 dark:text-white`

### Secondary Text
- `text-gray-500 dark:text-gray-400`

### Tertiary Text
- `text-gray-400 dark:text-gray-500`

---

## Key Rules

1. **NO colored background boxes** around P&L values - just colored text
2. **NO shaded backgrounds** on BUY/SELL/YES/NO badges - plain text only
3. **Consistent green-500/red-500** for all profit/loss colors
4. **Larger fonts** for important values (text-lg, text-xl)
5. **Strategy names always green** (text-green-500)
