/**
 * @fileoverview ファイルアップローダー（ドラッグ＆ドロップ対応）
 * @description Web ブラウザ用のファイルアップロード。メディア規格に基づくクライアントサイドバリデーション。
 * @module features/submission/components/FileUploader
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../../../shared/hooks/useResponsive';

/**
 * ファイルアップローダー
 * @param {{
 *   value: File|null,
 *   onChange: (file: File|null) => void,
 *   selectedSpec: Object|null,
 *   disabled: boolean
 * }} props
 * @description selectedSpec が null の場合は「媒体種別を先に選択してください」を表示
 */
export default function FileUploader({ value, onChange, selectedSpec, disabled }) {
  const { isMobile } = useResponsive();
  const [validationError, setValidationError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  /**
   * ファイルバリデーション
   * @param {File} file
   * @returns {string|null} エラーメッセージ（null = OK）
   */
  const validateFile = useCallback((file) => {
    if (!selectedSpec) return '媒体種別を先に選択してください';

    // 拡張子チェック
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!selectedSpec.allowed_extensions.includes(ext)) {
      const allowed = selectedSpec.allowed_extensions.join(', ');
      return `許可されていないファイル形式です。許可形式: ${allowed}`;
    }

    // サイズチェック
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > selectedSpec.max_file_size_mb) {
      return `ファイルサイズが上限を超えています（${selectedSpec.max_file_size_mb}MB まで）`;
    }

    return null;
  }, [selectedSpec]);

  /**
   * ファイル処理（バリデーション → onChange）
   */
  const handleFile = useCallback((file) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      onChange(null);
    } else {
      setValidationError(null);
      onChange(file);
    }
  }, [validateFile, onChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    if (!disabled && selectedSpec) {
      inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    onChange(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // 媒体種別未選択
  if (!selectedSpec) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>媒体種別を先に選択してください</Text>
      </View>
    );
  }

  // accept 属性用の文字列
  const accept = selectedSpec.allowed_extensions.map((e) => '.' + e).join(',');

  return (
    <View>
      {/* ファイル選択済み */}
      {value ? (
        <View style={styles.selectedContainer}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{value.name}</Text>
            <Text style={styles.fileSize}>
              {(value.size / (1024 * 1024)).toFixed(1)} MB
            </Text>
          </View>
          <TouchableOpacity onPress={handleRemove} disabled={disabled}>
            <Text style={styles.removeText}>削除</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ドラッグ＆ドロップエリア */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{
            ...dropZoneStyle,
            borderColor: isDragOver ? '#4dabf7' : '#3d3d5c',
            backgroundColor: isDragOver ? '#252544' : '#2d2d44',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: isMobile ? '20px 12px' : '32px 16px',
          }}
        >
          <Text style={styles.dropText}>
            ファイルをドラッグ＆ドロップ{'\n'}またはクリックして選択
          </Text>
          <Text style={styles.specHint}>
            対応形式: {selectedSpec.allowed_extensions.join(', ')} / 最大 {selectedSpec.max_file_size_mb}MB
          </Text>
        </div>
      )}

      {/* hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* バリデーションエラー */}
      {validationError && (
        <Text style={styles.errorText}>{validationError}</Text>
      )}
    </View>
  );
}

const dropZoneStyle = {
  padding: '32px 16px',
  borderRadius: '8px',
  borderWidth: '2px',
  borderStyle: 'dashed',
  textAlign: 'center',
  transition: 'border-color 0.2s, background-color 0.2s',
};

const styles = StyleSheet.create({
  disabledContainer: {
    backgroundColor: '#2d2d44',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d5c',
    borderStyle: 'dashed',
    alignItems: 'center',
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
    fontSize: 13,
  },
  selectedContainer: {
    backgroundColor: '#2d2d44',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  removeText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '600',
  },
  dropText: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
  },
  specHint: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 8,
  },
});
