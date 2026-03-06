/**
 * @fileoverview ルール文書カード
 * @description 文書1件を表示。document_type バッジ、バージョン、
 *              SimpleMarkdown による本文レンダリング、編集ボタン。
 * @module features/rules/components/RuleDocumentCard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../../shared/theme';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { DOCUMENT_TYPE_CONFIG } from '../../../shared/constants/statusConfig';
import { formatDateJST } from '../../../shared/utils/dateFormat';
import SimpleMarkdown from './SimpleMarkdown';

/**
 * ルール文書カード
 */
export default React.memo(function RuleDocumentCard({ document, onEdit, canEdit }) {
  const { isMobile } = useResponsive();
  const typeConfig = DOCUMENT_TYPE_CONFIG[document.document_type] || DOCUMENT_TYPE_CONFIG.josenai_rule;

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      {/* ヘッダー: バッジ + バージョン */}
      <View style={styles.headerRow}>
        <Badge label={typeConfig.label} bg={typeConfig.bg} color={typeConfig.text} />
        <Text style={styles.version}>v{document.version}</Text>
      </View>

      {/* タイトル */}
      <Text style={styles.title}>{document.title}</Text>

      {/* 更新日時 */}
      <Text style={styles.updatedAt}>
        最終更新: {formatDateJST(document.updated_at)}
      </Text>

      <View style={styles.divider} />

      {/* Markdown 本文 */}
      <SimpleMarkdown content={document.content} />

      {/* 編集ボタン（審査者のみ） */}
      {canEdit && (
        <>
          <View style={styles.divider} />
          <Button
            variant="outline"
            size="sm"
            onPress={() => onEdit(document)}
            style={styles.editButton}
          >
            編集する
          </Button>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardMobile: {
    padding: spacing.md,
    marginHorizontal: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  version: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
  },
  title: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  updatedAt: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceTint.primary,
  },
});
