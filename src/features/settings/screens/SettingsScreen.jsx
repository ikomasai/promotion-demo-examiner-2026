/**
 * @fileoverview 設定画面 - システム設定管理
 * @description システム設定の閲覧と編集。4セクション構成:
 *              提出設定、AI自動承認設定、AI設定、パスワード変更。
 *              フィールド毎の即時保存。非admin審査者は読取専用。
 * @module features/settings/screens/SettingsScreen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAdmin } from '../../../shared/contexts/AdminContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { useAppSettings } from '../hooks/useAppSettings';
import SettingItem from '../components/SettingItem';
import AutoApproveWarningModal from '../components/AutoApproveWarningModal';
import PasswordChangeModal from '../components/PasswordChangeModal';

/**
 * 設定画面
 * @returns {React.ReactElement}
 */
export default function SettingsScreen() {
  const { isMobile } = useResponsive();
  const { isAdmin } = useAdmin();
  const { showSuccess, showError } = useToast();
  const { settings, loading, error, refresh, updateSetting, updating } = useAppSettings();

  // 自動承認モーダル
  const [showAutoApproveModal, setShowAutoApproveModal] = useState(false);
  // パスワード変更モーダル: null = 非表示, 'koho'|'kikaku'|'super' = 表示
  const [passwordChangeRole, setPasswordChangeRole] = useState(null);

  const isReadOnly = !isAdmin;
  const isAutoApproveEnabled = settings.auto_approve_enabled === 'true';

  /**
   * 設定値を更新（Toast 通知付き）
   */
  const handleUpdateSetting = useCallback(
    async (key, value) => {
      const result = await updateSetting(key, value);
      if (result.success) {
        showSuccess('設定を更新しました');
      } else {
        showError(result.error || '設定の更新に失敗しました');
      }
    },
    [updateSetting, showSuccess, showError],
  );

  /**
   * 自動承認トグルのハンドラ
   * OFF→ON: モーダルで確認 / ON→OFF: 即座に更新
   */
  const handleAutoApproveToggle = useCallback(
    (value) => {
      if (value === 'true') {
        // OFF → ON: 免責モーダル表示
        setShowAutoApproveModal(true);
      } else {
        // ON → OFF: 即座に無効化
        handleUpdateSetting('auto_approve_enabled', 'false');
      }
    },
    [handleUpdateSetting],
  );

  /**
   * 自動承認モーダルで確認
   */
  const handleAutoApproveConfirm = useCallback(() => {
    setShowAutoApproveModal(false);
    handleUpdateSetting('auto_approve_enabled', 'true');
  }, [handleUpdateSetting]);

  /**
   * 自動承認モーダルでキャンセル
   */
  const handleAutoApproveCancel = useCallback(() => {
    setShowAutoApproveModal(false);
  }, []);

  // ローディング中
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={styles.loadingText}>設定を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#4dabf7" />
        }
      >
        {/* ヘッダー */}
        <Text style={styles.screenTitle}>システム設定</Text>

        {/* 閲覧専用バナー */}
        {isReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>閲覧モード — 設定の変更には管理者権限が必要です</Text>
          </View>
        )}

        {/* エラーバナー */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* セクション1: 提出設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提出設定</Text>
          <SettingItem
            type="toggle"
            label="提出受付"
            description="有効にすると一般ユーザーが素材を提出可能"
            value={settings.submission_enabled}
            onValueChange={(v) => handleUpdateSetting('submission_enabled', v)}
            disabled={isReadOnly || updating}
          />
          <SettingItem
            type="number"
            label="事前チェック上限"
            value={settings.sandbox_daily_limit}
            onValueChange={(v) => handleUpdateSetting('sandbox_daily_limit', v)}
            disabled={isReadOnly || updating}
            suffix="回/日"
            min={0}
            max={99}
          />
        </View>

        {/* セクション2: AI 自動承認設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 自動承認設定</Text>
          <SettingItem
            type="toggle"
            label="自動承認"
            description="AIスコアが閾値以上の提出を自動承認"
            value={settings.auto_approve_enabled}
            onValueChange={handleAutoApproveToggle}
            disabled={isReadOnly || updating}
          />
          {isAutoApproveEnabled && (
            <>
              <SettingItem
                type="number"
                label="閾値"
                value={settings.auto_approve_threshold}
                onValueChange={(v) => handleUpdateSetting('auto_approve_threshold', v)}
                disabled={isReadOnly || updating}
                suffix="%以上を自動承認"
                min={0}
                max={100}
              />
              <View style={styles.warningPanel}>
                <Text style={styles.warningTitle}>⚠ 自動承認が有効です</Text>
                <Text style={styles.warningText}>
                  AIスコアが{settings.auto_approve_threshold || '?'}%以上の提出物は
                  人間の審査なしに自動承認されます。
                </Text>
              </View>
            </>
          )}
        </View>

        {/* セクション3: AI 設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 設定</Text>
          <SettingItem
            type="number"
            label="AI判定タイムアウト"
            value={settings.ai_timeout_seconds}
            onValueChange={(v) => handleUpdateSetting('ai_timeout_seconds', v)}
            disabled={isReadOnly || updating}
            suffix="秒"
            min={5}
            max={120}
          />
        </View>

        {/* セクション4: パスワード変更（admin限定） */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>パスワード変更</Text>
            <SettingItem
              type="button"
              label="広報部パスワード変更"
              buttonLabel="広報部パスワードを変更"
              onPress={() => setPasswordChangeRole('koho')}
              disabled={updating}
            />
            <SettingItem
              type="button"
              label="企画管理部パスワード変更"
              buttonLabel="企画管理部パスワードを変更"
              onPress={() => setPasswordChangeRole('kikaku')}
              disabled={updating}
            />
            <SettingItem
              type="button"
              label="管理者パスワード変更"
              buttonLabel="管理者パスワードを変更"
              onPress={() => setPasswordChangeRole('super')}
              disabled={updating}
            />
          </View>
        )}

        {/* 下部余白 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 自動承認免責モーダル */}
      <AutoApproveWarningModal
        visible={showAutoApproveModal}
        onConfirm={handleAutoApproveConfirm}
        onCancel={handleAutoApproveCancel}
      />

      {/* パスワード変更モーダル */}
      <PasswordChangeModal
        visible={passwordChangeRole !== null}
        role={passwordChangeRole}
        onClose={() => setPasswordChangeRole(null)}
        onSuccess={() => showSuccess('パスワードを変更しました')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContentMobile: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#a0a0a0',
    fontSize: 14,
    marginTop: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  readOnlyBanner: {
    backgroundColor: '#1e2d44',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4dabf7',
  },
  readOnlyText: {
    color: '#4dabf7',
    fontSize: 13,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#3d1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  warningPanel: {
    backgroundColor: '#3d3520',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff9800',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
