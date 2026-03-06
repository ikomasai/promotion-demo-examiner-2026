/**
 * @fileoverview デザイントークン - アプリ全体の色・spacing・typography を一元管理
 * @module shared/theme
 */

export const colors = {
  bg: {
    primary: '#1a1a2e',
    elevated: '#2d2d44',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#e0e0e0',
    tertiary: '#a0a0a0',
    muted: '#888888',
    disabled: '#666666',
  },
  border: {
    default: '#3d3d5c',
  },
  accent: {
    primary: '#4dabf7',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    teal: '#26a69a',
    google: '#34a853',
    purple: '#ab47bc',
  },
  surfaceTint: {
    primary: '#1e2d44',
    success: '#1e3525',
    warning: '#3d3520',
    danger: '#3d1e1e',
    teal: '#1e3535',
    purple: '#2d1e44',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  heading2: { fontSize: 24, fontWeight: '700' },
  heading3: { fontSize: 20, fontWeight: '700' },
  heading4: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 14 },
  bodyLarge: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12 },
  small: { fontSize: 11, fontWeight: '600' },
};

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 20,
};
