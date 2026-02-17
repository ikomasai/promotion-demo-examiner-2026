/**
 * @fileoverview リスクスコア表示コンポーネント
 * @module features/submission/components/RiskScoreDisplay
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/** カテゴリの日本語ラベル */
const CATEGORY_LABELS = {
  prohibited: '禁止事項',
  copyright: '著作権',
  format: 'フォーマット',
};

/** カテゴリの表示順 */
const CATEGORY_ORDER = ['prohibited', 'copyright', 'format'];

/**
 * スコアに応じた色とラベルを返す
 * @param {number|null} score
 */
function getScoreStyle(score) {
  if (score === null || score === undefined) {
    return { color: '#a0a0a0', label: 'スキップ' };
  }
  if (score <= 10) return { color: '#4caf50', label: '低リスク' };
  if (score <= 50) return { color: '#ff9800', label: '中リスク' };
  return { color: '#f44336', label: '高リスク' };
}

/**
 * フラグ付き項目をカテゴリ別にグループ化
 * @param {Array} details - ai_risk_details
 * @param {Array} checkItems - チェック項目マスタ（カテゴリ情報付き）
 */
function groupFlaggedItems(details) {
  if (!details) return {};

  const flagged = details.filter((d) => d.flagged);
  const groups = {};

  for (const item of flagged) {
    // item_code のプレフィックスからカテゴリを推定
    const category = item.item_code?.startsWith('PRH')
      ? 'prohibited'
      : item.item_code?.startsWith('CPR')
        ? 'copyright'
        : item.item_code?.startsWith('FMT')
          ? 'format'
          : 'other';

    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
  }

  return groups;
}

/**
 * リスクスコア表示
 * @param {{
 *   result: { ai_risk_score: number|null, ai_risk_details: Array|null, skipped?: boolean, reason?: string },
 *   onReset: () => void
 * }} props
 */
export default function RiskScoreDisplay({ result, onReset }) {
  const { ai_risk_score, ai_risk_details, skipped, reason } = result;
  const { color, label } = getScoreStyle(ai_risk_score);
  const flaggedGroups = groupFlaggedItems(ai_risk_details);
  const hasFlagged = Object.keys(flaggedGroups).length > 0;

  return (
    <View style={styles.container}>
      {/* スコアヘッダー */}
      <View style={styles.scoreHeader}>
        {skipped ? (
          <View style={styles.skippedBadge}>
            <Text style={styles.skippedText}>AI判定スキップ</Text>
            <Text style={styles.skippedReason}>
              {reason === 'timeout' && 'タイムアウトしました'}
              {reason === 'api_error' && 'API エラーが発生しました'}
              {reason === 'file_too_large_for_ai' && 'ファイルサイズが大きすぎます（20MB超）'}
              {reason === 'gemini_api_key_not_configured' && 'AI判定が設定されていません'}
              {reason === 'empty_response' && 'AIからの応答がありませんでした'}
              {!reason && 'AI判定をスキップしました'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.score, { color }]}>{ai_risk_score}%</Text>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </>
        )}
      </View>

      {/* フラグ付き項目（カテゴリ別） */}
      {hasFlagged && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>指摘事項</Text>
          {CATEGORY_ORDER.map((cat) => {
            const items = flaggedGroups[cat];
            if (!items?.length) return null;
            return (
              <View key={cat} style={styles.categoryGroup}>
                <Text style={styles.categoryLabel}>
                  {CATEGORY_LABELS[cat] || cat}
                </Text>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.flaggedItem}>
                    <Text style={styles.itemCode}>{item.item_code}</Text>
                    <Text style={styles.itemReason}>{item.reason}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {/* 免責表示 */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          この判定結果は AI による自動検出であり、法的助言ではありません。
          最終判断は審査者が行います。
        </Text>
      </View>

      {/* リセットボタン */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetButtonText}>もう一度試す</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  scoreHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    marginBottom: 16,
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  skippedBadge: {
    alignItems: 'center',
  },
  skippedText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  skippedReason: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  categoryGroup: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4dabf7',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  flaggedItem: {
    backgroundColor: '#2d2d44',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  itemCode: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  itemReason: {
    fontSize: 13,
    color: '#e0e0e0',
  },
  disclaimer: {
    backgroundColor: '#1e1e35',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3d3d5c',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#888',
    lineHeight: 18,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  resetButtonText: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
});
