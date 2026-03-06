/**
 * @fileoverview 提出フォーム - 事前チェック/正式提出共通
 * @description ファイルアップロードと入力フォームの共通コンポーネント。
 *              事前チェック画面と正式提出画面で再利用。
 * @module features/submission/components/SubmissionForm
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import OrganizationSelect from './OrganizationSelect';
import ProjectSelect from './ProjectSelect';
import MediaTypeSelect from './MediaTypeSelect';
import FileUploader from './FileUploader';

/**
 * @typedef {Object} SubmissionFormProps
 * @property {Function} onSubmit - 提出時のコールバック
 * @property {boolean} [loading=false] - 送信中フラグ
 * @property {boolean} [disabled=false] - 無効状態
 * @property {string} [submitLabel='提出'] - 送信ボタンのラベル
 */

/**
 * @typedef {Object} FormData
 * @property {string|null} organizationId - 選択された団体ID
 * @property {string|null} projectId - 選択された企画ID
 * @property {string|null} mediaType - 選択されたメディア種別
 * @property {string} submissionType - 提出先 (kikaku | koho)
 * @property {File|null} file - アップロードファイル
 */

/**
 * 提出フォーム
 * @description 事前チェックと正式提出で共通使用するフォーム
 *              - 提出先選択（企画管理部/広報部）
 *              - 団体選択（OrganizationSelect）
 *              - 企画選択（ProjectSelect）
 *              - メディア種別選択（MediaTypeSelect）
 *              - ファイルアップロード（FileUploader）
 * @param {SubmissionFormProps} props
 * @returns {React.ReactElement}
 */
export default function SubmissionForm({
  onSubmit,
  loading = false,
  disabled = false,
  submitLabel = '提出',
}) {
  const { isMobile } = useResponsive();

  const [formData, setFormData] = useState({
    organizationId: null,
    projectId: null,
    mediaType: null,
    submissionType: 'kikaku',
    file: null,
  });

  /** FileUploader に渡す媒体規格 */
  const [selectedSpec, setSelectedSpec] = useState(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 団体変更ハンドラ（企画をリセット）
   */
  const handleOrganizationChange = useCallback((orgId) => {
    setFormData((prev) => ({
      ...prev,
      organizationId: orgId,
      projectId: null,
    }));
  }, []);

  /**
   * 媒体種別変更ハンドラ（ファイルをリセット、spec を更新）
   */
  const handleMediaTypeChange = useCallback((mediaType, spec) => {
    setFormData((prev) => ({
      ...prev,
      mediaType,
      file: null,
    }));
    setSelectedSpec(spec);
  }, []);

  const handleSubmit = () => {
    if (!isValid()) return;
    onSubmit?.(formData);
  };

  const isValid = () => {
    return formData.organizationId && formData.projectId && formData.mediaType && formData.file;
  };

  const isDisabled = loading || disabled;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* 提出先選択 */}
      <View style={styles.section}>
        <Text style={styles.label}>提出先</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.submissionType === 'kikaku' && styles.radioSelected,
            ]}
            onPress={() => updateField('submissionType', 'kikaku')}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.radioText,
                formData.submissionType === 'kikaku' && styles.radioTextSelected,
              ]}
            >
              企画管理部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, formData.submissionType === 'koho' && styles.radioSelected]}
            onPress={() => updateField('submissionType', 'koho')}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.radioText,
                formData.submissionType === 'koho' && styles.radioTextSelected,
              ]}
            >
              広報部
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 団体選択 */}
      <View style={styles.section}>
        <Text style={styles.label}>団体</Text>
        <OrganizationSelect
          value={formData.organizationId}
          onChange={handleOrganizationChange}
          disabled={isDisabled}
        />
      </View>

      {/* 企画選択 */}
      <View style={styles.section}>
        <Text style={styles.label}>企画</Text>
        <ProjectSelect
          value={formData.projectId}
          onChange={(id) => updateField('projectId', id)}
          organizationId={formData.organizationId}
          disabled={isDisabled}
        />
      </View>

      {/* メディア種別 */}
      <View style={styles.section}>
        <Text style={styles.label}>媒体種別</Text>
        <MediaTypeSelect
          value={formData.mediaType}
          onChange={handleMediaTypeChange}
          disabled={isDisabled}
        />
      </View>

      {/* ファイルアップロード */}
      <View style={styles.section}>
        <Text style={styles.label}>ファイル</Text>
        <FileUploader
          value={formData.file}
          onChange={(file) => updateField('file', file)}
          selectedSpec={selectedSpec}
          disabled={isDisabled}
        />
      </View>

      {/* 提出ボタン */}
      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        disabled={!isValid() || isDisabled}
        loading={loading}
        style={styles.submitButton}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  containerMobile: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioButton: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.accent.primary,
  },
  radioText: {
    ...typography.body,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  radioTextSelected: {
    color: colors.accent.primary,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
