/**
 * @fileoverview トーストコンテキスト - アプリ内通知管理
 * @description 成功・エラー・情報メッセージをアプリ全体で表示。
 *              自動消去タイマー付き。
 * @module shared/contexts/ToastContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * @typedef {'success'|'error'|'info'|'warning'} ToastType
 * @description トースト種別
 */

/**
 * @typedef {Object} Toast
 * @property {string} id - 一意識別子
 * @property {string} message - 表示メッセージ
 * @property {ToastType} type - トースト種別
 * @property {number} duration - 表示時間（ミリ秒）
 */

/**
 * @typedef {Object} ToastContextValue
 * @property {Toast[]} toasts - 現在表示中のトースト一覧
 * @property {Function} showToast - トースト表示
 * @property {Function} showSuccess - 成功トースト表示
 * @property {Function} showError - エラートースト表示
 * @property {Function} showInfo - 情報トースト表示
 * @property {Function} hideToast - トースト非表示
 */

const ToastContext = createContext(null);

/** @constant {number} デフォルト表示時間（ミリ秒） */
const DEFAULT_DURATION = 3000;

/**
 * トーストプロバイダー
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * トースト表示
   * @param {string} message - メッセージ
   * @param {ToastType} type - 種別
   * @param {number} duration - 表示時間（ミリ秒）
   */
  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // 自動消去
    setTimeout(() => {
      hideToast(id);
    }, duration);
  }, []);

  /**
   * 成功トースト表示
   * @param {string} message
   */
  const showSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  /**
   * エラートースト表示
   * @param {string} message
   */
  const showError = useCallback((message) => {
    showToast(message, 'error', 5000); // エラーは長めに表示
  }, [showToast]);

  /**
   * 情報トースト表示
   * @param {string} message
   */
  const showInfo = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  /**
   * トースト非表示
   * @param {string} id
   */
  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * トーストコンテナ（表示領域）
 * @param {Object} props
 * @param {Toast[]} props.toasts
 * @param {Function} props.onHide
 */
function ToastContainer({ toasts, onHide }) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
}

/**
 * トーストアイテム（個別トースト）
 * @param {Object} props
 * @param {Toast} props.toast
 * @param {Function} props.onHide
 */
function ToastItem({ toast, onHide }) {
  const backgroundColor = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  }[toast.type];

  return (
    <View style={[styles.toast, { backgroundColor }]}>
      <Text style={styles.message}>{toast.message}</Text>
    </View>
  );
}

/**
 * トーストコンテキストフック
 * @returns {ToastContextValue}
 * @throws {Error} ToastProvider外で使用した場合
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast は ToastProvider 内で使用してください');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    marginVertical: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
