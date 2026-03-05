<!-- Generated: 2026-03-05 | Files scanned: 8 | Token estimate: ~650 -->
# Architecture

## Entry Point Chain

```
expo/AppEntry.js → registerRootComponent(App)
  App.jsx
    └─ GestureHandlerRootView
         └─ AuthProvider          ← Email/Password 認証 (Supabase Auth)
              └─ AdminProvider    ← セッション限定ロール認証 (bcrypt)
                   └─ ToastProvider  ← 通知システム
                        └─ AppNavigator  ← 認証状態ルーティング
```

**重要**: `package.json` の `"main"` は `"expo/AppEntry"` 必須。`"App.jsx"` にすると白画面。

## Provider 階層

| Provider | Context Hook | 責務 |
|----------|-------------|------|
| `AuthProvider` | `useAuth()` | user, profile, signIn/signUp/signOut, refreshProfile |
| `AdminProvider` | `useAdmin()` | screens, verifyPassword, isReviewer/isAdmin flags |
| `ToastProvider` | `useToast()` | showSuccess/showError/showInfo, toasts array |

## ロールベースアクセス制御

```
全ユーザー ──→ サンドボックス, 提出, 履歴
     │
     ├─ koho (広報部) ──→ + ダッシュボード, ルール管理, 設定
     ├─ kikaku (企画管理部) ──→ + ダッシュボード, ルール管理, 設定
     └─ super (管理者) ──→ + 上記すべて + マスタ管理
```

- 認証: Supabase Auth (Email/Password, `@kindai.ac.jp` ドメイン限定)
- 管理者認証: `verify-admin-password` Edge Function → bcrypt 検証 → セッション内のみ有効

## デザインシステム

- **テーマ**: ダークモード固定 (背景 `#1a1a2e`, アクセント `#4dabf7`)
- **スタイル**: `StyleSheet.create()` (React Native 標準)
- **レスポンシブ**: `useResponsive()` → `isMobile` (<768), `isTablet` (768-1023), `isDesktop` (>=1024)
- **エラー境界**: 各画面を `withErrorBoundary()` でラップ (DrawerNavigator)
