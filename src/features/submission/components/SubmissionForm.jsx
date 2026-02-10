/**
 * @fileoverview 提出フォーム - サンドボックス/正式提出共通
 * @description ファイルアップロードと入力フォームの共通コンポーネント。
 *              サンドボックス画面と正式提出画面で再利用。
 * @module features/submission/components/SubmissionForm
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
 * @property {string} submissionType - 提出種別 (kikaku | sns)
 * @property {File|null} file - アップロードファイル
 */

/**
 * 提出フォーム
 * @description サンドボックスと正式提出で共通使用するフォーム
 *              - 団体選択（OrganizationSelect）
 *              - 企画選択（ProjectSelect）
 *              - メディア種別選択（MediaTypeSelect）
 *              - 提出種別選択（企画物/SNS）
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
  /**
   * フォームデータ状態
   * @type {[FormData, Function]}
   */
  const [formData, setFormData] = useState({
    organizationId: null,
    projectId: null,
    mediaType: null,
    submissionType: 'kikaku',
    file: null,
  });

  /**
   * フォームフィールド更新
   * @param {string} field - フィールド名
   * @param {any} value - 値
   */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 提出処理
   */
  const handleSubmit = () => {
    if (!isValid()) return;
    onSubmit?.(formData);
  };

  /**
   * バリデーション
   * @returns {boolean} フォームが有効かどうか
   */
  const isValid = () => {
    return (
      formData.organizationId &&
      formData.projectId &&
      formData.mediaType &&
      formData.file
    );
  };

  return (
    <View style={styles.container}>
      {/* 提出種別選択 */}
      <View style={styles.section}>
        <Text style={styles.label}>提出種別</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.submissionType === 'kikaku' && styles.radioSelected,
            ]}
            onPress={() => updateField('submissionType', 'kikaku')}
            disabled={loading || disabled}
          >
            <Text
              style={[
                styles.radioText,
                formData.submissionType === 'kikaku' && styles.radioTextSelected,
              ]}
            >
              企画物
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.submissionType === 'sns' && styles.radioSelected,
            ]}
            onPress={() => updateField('submissionType', 'sns')}
            disabled={loading || disabled}
          >
            <Text
              style={[
                styles.radioText,
                formData.submissionType === 'sns' && styles.radioTextSelected,
              ]}
            >
              SNS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* プレースホルダー: 各Selectコンポーネントは後続タスクで実装 */}
      <View style={styles.section}>
        <Text style={styles.label}>団体</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>OrganizationSelect (T025)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>企画</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>ProjectSelect (T026)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>メディア種別</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>MediaTypeSelect (T027)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>ファイル</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>FileUploader (T024)</Text>
        </View>
      </View>

      {/* 提出ボタン */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isValid() || loading || disabled) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isValid() || loading || disabled}
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
  placeholder: {
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d5c',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    fontSize: 12,
    fontStyle: 'italic',
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
