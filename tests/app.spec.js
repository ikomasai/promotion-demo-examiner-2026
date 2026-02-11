/**
 * @fileoverview アプリ基本動作テスト
 * @description Phase 2 完了後の基本動作確認
 */

const { test, expect } = require('@playwright/test');

test.describe('Phase 2 動作確認', () => {
  test('ログイン画面が表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルが表示される
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    // サブタイトルが表示される
    await expect(page.getByText('情宣AI判定システム')).toBeVisible();

    // ログインボタンが表示される
    await expect(page.getByText('Google でログイン')).toBeVisible();

    // ドメイン説明が表示される
    await expect(page.getByText('@kindai.ac.jp')).toBeVisible();
  });

  test('スクリーンショットを撮影', async ({ page }) => {
    await page.goto('/');

    // ページの読み込みを待つ
    await page.waitForSelector('text=生駒祭 2026', { timeout: 30000 });

    // スクリーンショット保存
    await page.screenshot({ path: 'tests/screenshots/login-screen.png', fullPage: true });
  });
});
