/**
 * @fileoverview 画面エラーバウンダリ - 画面単位のエラーハンドリング
 * @description 各画面をラップしてエラーを捕捉、フォールバックUIを表示。
 *              アプリ全体のクラッシュを防ぎ、画面単位でエラー回復を可能に。
 * @module shared/components/ScreenErrorBoundary
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

/**
 * エラーバウンダリ状態
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - エラー発生フラグ
 * @property {Error|null} error - 捕捉したエラー
 */

/**
 * 画面エラーバウンダリ
 * @description クラスコンポーネントでエラーバウンダリを実装
 *              React の componentDidCatch / getDerivedStateFromError を使用
 * @extends {React.Component}
 */
export default class ScreenErrorBoundary extends React.Component {
  /**
   * コンストラクタ
   * @param {Object} props
   */
  constructor(props) {
    super(props);
    /** @type {ErrorBoundaryState} */
    this.state = { hasError: false, error: null };
  }

  /**
   * エラー発生時の状態更新
   * @param {Error} error - 捕捉したエラー
   * @returns {ErrorBoundaryState}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * エラーログ出力
   * @param {Error} error - 捕捉したエラー
   * @param {Object} errorInfo - エラー情報
   */
  componentDidCatch(error, errorInfo) {
    console.error('ScreenErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * エラー状態をリセット（再試行）
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * レンダリング
   * @returns {React.ReactElement}
   */
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>
            {this.state.error?.message || '予期せぬエラーが発生しました。'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    padding: spacing.xl,
  },
  title: {
    ...typography.heading3,
    color: colors.accent.danger,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    maxWidth: 300,
  },
  button: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
  },
  buttonText: {
    ...typography.label,
    color: colors.text.primary,
  },
});
