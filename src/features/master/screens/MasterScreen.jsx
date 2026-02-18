/**
 * @fileoverview マスタ管理画面 - 団体・企画管理
 * @description 団体・企画の CSV インポートによる一括管理。
 *              管理者（admin）がCSVアップロードで団体・企画マスタを一括更新。
 * @module features/master/screens/MasterScreen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import SkeletonCard from '../../../shared/components/SkeletonCard';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import CsvImporter from '../components/CsvImporter';
import OrganizationTable from '../components/OrganizationTable';
import ProjectTable from '../components/ProjectTable';
import { useMasterData } from '../hooks/useMasterData';
import { useCsvImport } from '../hooks/useCsvImport';
import { useToast } from '../../../shared/contexts/ToastContext';

/**
 * マスタ管理画面
 */
export default function MasterScreen() {
  const { isMobile } = useResponsive();
  const { organizations, projects, loading, error, refresh } = useMasterData();
  const { importing, importCsv } = useCsvImport();
  const { showSuccess, showError } = useToast();

  /**
   * CSV インポート実行
   */
  const handleImport = useCallback(async (file, type) => {
    const label = type === 'organizations' ? '団体' : '企画';
    const result = await importCsv(file, type);

    if (result.success) {
      showSuccess(`${label}データを ${result.count} 件インポートしました`);
      refresh();
    } else {
      showError(result.error || `${label}のインポートに失敗しました`);
    }
  }, [importCsv, refresh, showSuccess, showError]);

  /** 最終更新日時フォーマット */
  const formatLatestUpdate = (items) => {
    if (!items || items.length === 0) return null;
    const latest = items.reduce((max, item) =>
      item.updated_at > max ? item.updated_at : max,
      items[0].updated_at
    );
    return new Date(latest).toLocaleString('ja-JP');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading && (organizations.length > 0 || projects.length > 0)}
          onRefresh={refresh}
          tintColor="#4dabf7"
        />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>マスタ管理</Text>
      </View>

      {/* エラーバナー */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ローディング（初回のみ） */}
      {loading && organizations.length === 0 && projects.length === 0 && (
        <View style={styles.section}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {/* ===== 団体マスタセクション ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>団体マスタ</Text>
          {organizations.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{organizations.length}件</Text>
            </View>
          )}
        </View>

        <CsvImporter
          type="organizations"
          importing={importing}
          onImport={(file) => handleImport(file, 'organizations')}
        />

        {organizations.length > 0 && (
          <Text style={styles.updateInfo}>
            最終更新: {formatLatestUpdate(organizations)}
          </Text>
        )}

        {isMobile ? (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ minWidth: 400 }}>
              <OrganizationTable organizations={organizations} />
            </View>
          </ScrollView>
        ) : (
          <OrganizationTable organizations={organizations} />
        )}
      </View>

      {/* ===== 企画マスタセクション ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>企画マスタ</Text>
          {projects.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{projects.length}件</Text>
            </View>
          )}
        </View>

        <CsvImporter
          type="projects"
          importing={importing}
          onImport={(file) => handleImport(file, 'projects')}
        />

        {projects.length > 0 && (
          <Text style={styles.updateInfo}>
            最終更新: {formatLatestUpdate(projects)}
          </Text>
        )}

        {isMobile ? (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ minWidth: 400 }}>
              <ProjectTable projects={projects} />
            </View>
          </ScrollView>
        ) : (
          <ProjectTable projects={projects} />
        )}
      </View>

      {/* 下部余白 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorBanner: {
    backgroundColor: '#3d2f1f',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  errorText: {
    color: '#ff9800',
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: '#1e2d44',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  countText: {
    fontSize: 12,
    color: '#4dabf7',
    fontWeight: '600',
  },
  updateInfo: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
});
