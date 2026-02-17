/**
 * @fileoverview CSV インポーターコンポーネント
 * @description CSV ファイル選択 + インポートボタン。
 *              FileUploader の <input type="file"> パターンを CSV 用に簡略化。
 * @module features/master/components/CsvImporter
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * CSV インポーター
 * @param {{
 *   type: 'organizations'|'projects',
 *   importing: boolean,
 *   onImport: (file: File) => void
 * }} props
 */
export default function CsvImporter({ type, importing, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const label = type === 'organizations' ? '団体' : '企画';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile || importing) return;
    onImport(selectedFile);
    // インポート成功後のリセットは親が onImportComplete で refresh するため、
    // ここではファイルをクリアしておく
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSelectClick = () => {
    if (!importing) {
      inputRef.current?.click();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* ファイル選択ボタン */}
        <TouchableOpacity
          style={[styles.selectButton, importing && styles.disabledButton]}
          onPress={handleSelectClick}
          disabled={importing}
        >
          <Text style={styles.selectButtonText}>CSV ファイルを選択</Text>
        </TouchableOpacity>

        {/* ファイル名表示 */}
        <Text style={styles.fileName} numberOfLines={1}>
          {selectedFile ? selectedFile.name : '未選択'}
        </Text>

        {/* インポートボタン */}
        <TouchableOpacity
          style={[
            styles.importButton,
            (!selectedFile || importing) && styles.disabledButton,
          ]}
          onPress={handleImport}
          disabled={!selectedFile || importing}
        >
          {importing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.importButtonText}>インポート</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* hidden file input */}
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
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#2d2d44',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  selectButtonText: {
    color: '#a0a0a0',
    fontSize: 13,
    fontWeight: '500',
  },
  fileName: {
    flex: 1,
    color: '#888',
    fontSize: 13,
  },
  importButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
