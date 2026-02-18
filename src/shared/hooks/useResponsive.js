/**
 * @fileoverview レスポンシブフック
 * @description 画面幅に基づくブレークポイント判定。
 *              isMobile / isTablet / isDesktop を返す。
 * @module shared/hooks/useResponsive
 */

import { useWindowDimensions } from 'react-native';

/**
 * レスポンシブブレークポイントフック
 * @returns {{ isMobile: boolean, isTablet: boolean, isDesktop: boolean, width: number }}
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}
