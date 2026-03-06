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
import { colors, spacing, radii, typography } from '../../../shared/theme';

/**
 * 汎用設定項目
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
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    if (type === 'number' && value !== undefined) {
      setLocalValue(value);
    }
  }, [type, value]);

  const handleNumberBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || localValue.trim() === '') {
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
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
          <Switch
            value={isOn}
            onValueChange={(val) => onValueChange?.(val ? 'true' : 'false')}
            disabled={disabled}
            trackColor={{ false: colors.border.default, true: colors.accent.primary }}
            thumbColor={isOn ? colors.text.primary : colors.text.muted}
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
          {description && <Text style={styles.description}>{description}</Text>}
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
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
  },
  labelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  labelDisabled: {
    color: colors.text.disabled,
  },
  description: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    backgroundColor: colors.bg.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyLarge,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  numberInputDisabled: {
    backgroundColor: '#22223a',
    color: colors.text.disabled,
    borderColor: colors.bg.elevated,
  },
  suffix: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  button: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  buttonTextDisabled: {
    color: colors.text.disabled,
  },
});
