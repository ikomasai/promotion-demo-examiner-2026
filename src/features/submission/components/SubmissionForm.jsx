/**
 * @fileoverview 提出フォーム - サンドボックス/正式提出共通
 * @description ファイルアップロードと入力フォームの共通コンポーネント。
 *              サンドボックス画面と正式提出画面で再利用。
 * @module features/submission/components/SubmissionForm
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
 * @description サンドボックスと正式提出で共通使用するフォーム
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
    return (
      formData.organizationId &&
      formData.projectId &&
      formData.mediaType &&
      formData.file
    );
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
            style={[
              styles.radioButton,
              formData.submissionType === 'koho' && styles.radioSelected,
            ]}
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
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isValid() || isDisabled) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isValid() || isDisabled}
      >
        <Text style={styles.submitButtonText}>
          {loading ? '処理中...' : submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  containerMobile: {
    paddingHorizontal: 12,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#2d2d44',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#4dabf7',
  },
  radioText: {
    fontSize: 14,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  radioTextSelected: {
    color: '#4dabf7',
  },
  submitButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
