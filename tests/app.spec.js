/**
 * @fileoverview アプリ基本動作テスト
 * @description Email/Password 認証画面の E2E テスト
 */

const { test, expect } = require('@playwright/test');

test.describe('ログイン画面 表示確認', () => {
  test('ログイン画面の基本要素が表示される', async ({ page }) => {
    await page.goto('/');

    // タイトル
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('情宣AI判定システム')).toBeVisible();

    // フォーム入力欄
    await expect(page.getByPlaceholder('example@kindai.ac.jp')).toBeVisible();
    await expect(page.getByPlaceholder('6文字以上')).toBeVisible();

    // 送信ボタン
    await expect(page.getByTestId('submit-button')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toContainText('ログイン');

    // フッター
    await expect(page.getByText('大学祭実行委員会 情宣局')).toBeVisible();
  });

  test('空欄で送信するとバリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    // 空のまま送信
    await page.getByTestId('submit-button').click();

    // エラーメッセージ
    await expect(page.getByText('メールアドレスとパスワードを入力してください')).toBeVisible();
  });

  test('kindai.ac.jp 以外のドメインでエラーが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    await page.getByPlaceholder('example@kindai.ac.jp').fill('test@gmail.com');
    await page.getByPlaceholder('6文字以上').fill('password123');

    await page.getByTestId('submit-button').click();

    await expect(page.getByText('@kindai.ac.jp のメールアドレスを使用してください')).toBeVisible();
  });

  test('スクリーンショットを撮影', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: 'tests/screenshots/login-screen.png', fullPage: true });
  });
});
