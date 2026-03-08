<!-- Updated: 2026-03-08 | Files scanned: 10 | Token estimate: ~750 -->
# Architecture

## Entry Point Chain

```
expo/AppEntry.js → registerRootComponent(App)
  App.jsx
    └─ GestureHandlerRootView
         └─ ScreenErrorBoundary  ← アプリ全体のエラーキャッチ (2026-03-08追加)
              └─ AuthProvider          ← Email/Password 認証 (Supabase Auth)
                   └─ AdminProvider    ← セッション限定ロール認証 (bcrypt + sessionStorage)
                        └─ ToastProvider  ← 通知システム
                             └─ AppNavigator  ← 認証状態ルーティング
```

**重要**: `package.json` の `"main"` は `"expo/AppEntry"` 必須。`"App.jsx"` にすると白画面。

## Provider 階層

| Provider | Context Hook | 責務 |
|----------|-------------|------|
| `ScreenErrorBoundary` | (class component) | アプリ全体の未キャッチエラーを捕捉し、フォールバック UI を表示 |
| `AuthProvider` | `useAuth()` | user, profile, signIn/signUp/signOut, refreshProfile |
| `AdminProvider` | `useAdmin()` | screens, verifyPassword, isReviewer/isAdmin flags, **sessionStorage 永続化** |
| `ToastProvider` | `useToast()` | showSuccess/showError/showInfo, toasts array |

### AdminProvider の永続化

- 管理者パスワード認証成功時、screen 権限セットを `sessionStorage` に保存
- ページリロード時に `sessionStorage` から復元（再認証不要）
- ブラウザタブを閉じるとセッション終了（`sessionStorage` の仕様）
- ロール定義は `config/admin.json` を Single Source of Truth とし、フロントエンド (`src/shared/constants/adminConfig.js`) とバックエンド (`supabase/functions/_shared/adminConfig.ts`) で共有

## ロールベースアクセス制御

```
全ユーザー ──→ 事前チェック, 提出, 履歴
     │
     ├─ koho (広報部) ──→ + ダッシュボード, ルール管理, 設定
     ├─ kikaku (企画管理部) ──→ + ダッシュボード, ルール管理, 設定
     └─ super (管理者) ──→ + 上記すべて + マスタ管理
```

- 認証: Supabase Auth (Email/Password, `@kindai.ac.jp` ドメイン限定)
- 管理者認証: `verify-admin-password` Edge Function → bcrypt 検証 → sessionStorage + React state で保持

## デザインシステム

- **テーマ**: ダークモード固定 (背景 `#1a1a2e`, アクセント `#4dabf7`)
- **スタイル**: `StyleSheet.create()` (React Native 標準)
- **レスポンシブ**: `useResponsive()` → `isMobile` (<768), `isTablet` (768-1023), `isDesktop` (>=1024)
- **エラー境界**: App.jsx ルートに `ScreenErrorBoundary` + 各画面を `withErrorBoundary()` でラップ (DrawerNavigator)
- **共通コンポーネント**: Button, Badge, Card, Banner, ConfirmModal, FormInput 等 11 コンポーネント
