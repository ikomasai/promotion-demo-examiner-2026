/**
 * @fileoverview 汎用スケルトンローダー
 * @description パルスアニメーション付きプレースホルダー。
 *              リスト画面の初回ロード時に使用。
 * @module shared/components/SkeletonLoader
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

/**
 * 汎用スケルトンローダー
 * @param {{
 *   width: number | string,
 *   height: number,
 *   borderRadius?: number,
 *   style?: import('react-native').ViewStyle
 * }} props
 */
export default function SkeletonLoader({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#2d2d44',
  },
});
