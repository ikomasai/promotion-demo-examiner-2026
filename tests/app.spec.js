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

    // タブ
    await expect(page.getByTestId('tab-login')).toBeVisible();
    await expect(page.getByTestId('tab-register')).toBeVisible();

    // フォーム入力欄
    await expect(page.getByPlaceholder('example@kindai.ac.jp')).toBeVisible();
    await expect(page.getByPlaceholder('6文字以上')).toBeVisible();

    // 送信ボタン
    await expect(page.getByTestId('submit-button')).toBeVisible();

    // フッター
    await expect(page.getByText('大学祭実行委員会 情宣局')).toBeVisible();
  });

  test('タブ切替が動作する', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    // 初期状態: ログインタブがアクティブ → ボタンテキストは「ログイン」
    const submitButton = page.getByTestId('submit-button');
    await expect(submitButton).toContainText('ログイン');

    // 新規登録タブに切替
    await page.getByTestId('tab-register').click();

    // ボタンが「登録」に変わる
    await expect(submitButton).toContainText('登録');

    // ログインタブに戻す
    await page.getByTestId('tab-login').click();
    await expect(submitButton).toContainText('ログイン');
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

  test('新規登録時にパスワード6文字未満でエラーが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    // 新規登録タブに切替
    await page.getByTestId('tab-register').click();

    await page.getByPlaceholder('example@kindai.ac.jp').fill('test@kindai.ac.jp');
    await page.getByPlaceholder('6文字以上').fill('12345');

    await page.getByTestId('submit-button').click();

    await expect(page.getByText('パスワードは6文字以上で入力してください')).toBeVisible();
  });

  test('スクリーンショットを撮影', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('生駒祭 2026')).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: 'tests/screenshots/login-screen.png', fullPage: true });

    // 新規登録タブもキャプチャ
    await page.getByTestId('tab-register').click();
    await page.screenshot({ path: 'tests/screenshots/register-screen.png', fullPage: true });
  });
});
