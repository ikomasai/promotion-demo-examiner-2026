/**
 * @fileoverview CSV インポーターコンポーネント
 * @description CSV ファイル選択 + インポートボタン。
 * @module features/master/components/CsvImporter
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Button from '../../../shared/components/Button';

/**
 * CSV インポーター
 */
export default function CsvImporter({ type, importing, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const label = type === 'organizations' ? '団体' : '企画';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = () => {
    if (!selectedFile || importing) return;
    onImport(selectedFile);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSelectClick = () => {
    if (!importing) inputRef.current?.click();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.selectButton, importing && styles.disabledButton]}
          onPress={handleSelectClick}
          disabled={importing}
        >
          <Text style={styles.selectButtonText}>CSV ファイルを選択</Text>
        </TouchableOpacity>

        <Text style={styles.fileName} numberOfLines={1}>
          {selectedFile ? selectedFile.name : '未選択'}
        </Text>

        <Button
          variant="primary"
          size="sm"
          onPress={handleImport}
          disabled={!selectedFile || importing}
          loading={importing}
          style={styles.importButton}
        >
          インポート
        </Button>
      </View>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectButton: {
    backgroundColor: colors.bg.elevated,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  selectButtonText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  fileName: {
    flex: 1,
    color: colors.text.muted,
    fontSize: 13,
  },
  importButton: {
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
