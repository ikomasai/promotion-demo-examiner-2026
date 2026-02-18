/**
 * @fileoverview 汎用設定項目コンポーネント
 * @description toggle / number / button の3タイプを props.type で切り替え。
 *              設定画面の各項目で再利用する。
 * @module features/settings/components/SettingItem
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

/**
 * 汎用設定項目
 * @param {Object} props
 * @param {'toggle'|'number'|'button'} props.type - 表示タイプ
 * @param {string} props.label - ラベルテキスト
 * @param {string} [props.description] - 補足説明
 * @param {string} [props.value] - 現在値（toggle: "true"/"false", number: "30"）
 * @param {(value: string) => void} [props.onValueChange] - 値変更コールバック
 * @param {() => void} [props.onPress] - ボタン押下コールバック（button type）
 * @param {boolean} [props.disabled] - 無効化
 * @param {string} [props.suffix] - 単位ラベル（"回/日", "秒", "%以下を自動承認"）
 * @param {number} [props.min] - 最小値（number type）
 * @param {number} [props.max] - 最大値（number type）
 * @param {string} [props.buttonLabel] - ボタンラベル（button type）
 */
export default React.memo(function SettingItem({
  type,
  label,
  description,
  value,
  onValueChange,
  onPress,
  disabled = false,
  suffix,
  min,
  max,
  buttonLabel,
}) {
  // number type: ローカル入力値（入力中は DB 値と乖離する）
  const [localValue, setLocalValue] = useState(value || '');

  // 外部から value が変わったら同期
  useEffect(() => {
    if (type === 'number' && value !== undefined) {
      setLocalValue(value);
    }
  }, [type, value]);

  /**
   * 数値入力の blur ハンドラ
   * NaN → 元の値に戻す、空 → 元の値に戻す、範囲外 → clamp して保存
   */
  const handleNumberBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || localValue.trim() === '') {
      // 無効な入力 → 元の値に戻す
      setLocalValue(value || '');
      return;
    }
    let clamped = parsed;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    const result = String(clamped);
    setLocalValue(result);
    if (result !== value) {
      onValueChange?.(result);
    }
  };

  // --- button type ---
  if (type === 'button') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            {buttonLabel || label}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- toggle type ---
  if (type === 'toggle') {
    const isOn = value === 'true';
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>
          <Switch
            value={isOn}
            onValueChange={(val) => onValueChange?.(val ? 'true' : 'false')}
            disabled={disabled}
            trackColor={{ false: '#3d3d5c', true: '#4dabf7' }}
            thumbColor={isOn ? '#ffffff' : '#888888'}
          />
        </View>
      </View>
    );
  }

  // --- number type ---
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
        <View style={styles.numberRow}>
          <TextInput
            style={[styles.numberInput, disabled && styles.numberInputDisabled]}
            value={localValue}
            onChangeText={setLocalValue}
            onBlur={handleNumberBlur}
            keyboardType="numeric"
            editable={!disabled}
            selectTextOnFocus
          />
          {suffix && (
            <Text style={[styles.suffix, disabled && styles.labelDisabled]}>{suffix}</Text>
          )}
        </View>
      </View>
    </View>
  );
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2d2d44',
    borderRadius: 10,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  labelDisabled: {
    color: '#666666',
  },
  description: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  numberInputDisabled: {
    backgroundColor: '#22223a',
    color: '#666666',
    borderColor: '#2d2d44',
  },
  suffix: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  button: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4dabf7',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
});
