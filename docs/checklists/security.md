# Security Checklist: 生駒祭 情宣AI判定システム

**Purpose**: 認証・認可要件の品質検証 (PR レビュー時使用)
**Created**: 2026-01-25
**Feature**: [docs/spec.md](../spec.md)
**Focus**: 認証・認可 (Authentication & Authorization)

**Note**: このチェックリストは要件自体の品質（完全性・明確性・一貫性）を検証するものです。実装の動作確認ではありません。

---

## 認証要件の完全性 (Authentication Completeness)

- [ ] CHK001 - Google OAuth 認証のリダイレクト URI が明確に指定されているか？ [Completeness, Spec §認証・権限管理]
- [ ] CHK002 - @kindai.ac.jp ドメイン制限の検証タイミング（クライアント/サーバー/両方）が定義されているか？ [Gap, Spec §認証・権限管理]
- [ ] CHK003 - ドメイン制限違反時のエラーメッセージ要件が明記されているか？ [Completeness, Spec §認証・権限管理]
- [ ] CHK004 - セッション有効期限の要件が定義されているか？ [Gap]
- [ ] CHK005 - ログアウト時のセッション無効化要件が明記されているか？ [Gap]
- [ ] CHK006 - OAuth トークンのリフレッシュ要件が定義されているか？ [Gap]

## 管理者認証要件の明確性 (Admin Authentication Clarity)

- [ ] CHK007 - 3種類の管理者パスワード (koho/kikaku/super) の要件が区別して定義されているか？ [Clarity, Spec §app_settings]
- [ ] CHK008 - パスワードハッシュ方式 (SHA-256) の選定理由と適切性が検討されているか？ [Clarity, Spec §管理者認証]
  - ⚠️ **懸念**: SHA-256 は高速すぎてブルートフォース攻撃に脆弱。bcrypt/Argon2 を検討すべき
- [ ] CHK009 - 管理者パスワードモーダルの表示タイミングが明確か？（毎回ログイン時 or 初回のみ） [Ambiguity, Spec §ログインフロー]
- [ ] CHK010 - admin_role の永続化先が明確に定義されているか？（仕様書に sessionStorage と DB の矛盾あり） [Conflict, Spec §認証・権限管理 vs §データベース設計]
- [ ] CHK011 - 管理者認証の有効期限要件が定義されているか？ [Gap]
- [ ] CHK012 - パスワード入力失敗時のロックアウト要件が定義されているか？ [Gap]

## 認可要件の一貫性 (Authorization Consistency)

- [ ] CHK013 - admin_role の値 (NULL/koho/kikaku/super) と画面アクセス権限の対応が一貫しているか？ [Consistency, Spec §管理者権限構造]
- [ ] CHK014 - ダッシュボード閲覧範囲（SNS/企画物/全て）と admin_role の対応が明確か？ [Clarity, Spec §管理者権限構造]
- [ ] CHK015 - 「マスタ管理」「設定」画面へのアクセス権限がスーパー管理者のみと明記されているか？ [Completeness, Spec §ナビゲーション構成]
- [ ] CHK016 - 一般ユーザーが管理者画面 URL に直接アクセスした場合の挙動が定義されているか？ [Gap, Exception Flow]

## RLS ポリシー要件の完全性 (RLS Policy Completeness)

- [ ] CHK017 - submissions テーブルの SELECT ポリシーで「自分の提出」の定義が明確か？ [Clarity, Spec §RLS ポリシー]
- [ ] CHK018 - koho 管理者が SNS 提出のみ閲覧可能という RLS 要件が明記されているか？ [Completeness, Spec §submissions テーブル]
- [ ] CHK019 - kikaku 管理者が企画物のみ閲覧可能という RLS 要件が明記されているか？ [Completeness, Spec §submissions テーブル]
- [ ] CHK020 - super 管理者の全件閲覧権限の RLS 要件が明記されているか？ [Completeness, Spec §submissions テーブル]
- [ ] CHK021 - profiles テーブルの「本人のみ閲覧可能」要件の実装詳細が定義されているか？ [Clarity, Spec §RLS ポリシー]
- [ ] CHK022 - 管理者による UPDATE 権限（審査）の対象範囲制限が明記されているか？ [Gap, Spec §RLS ポリシー]

## セッション管理要件 (Session Management)

- [ ] CHK023 - 「ブラウザを閉じるとリセット」という要件と admin_role DB 保存の整合性は取れているか？ [Conflict, Spec §管理者認証]
- [ ] CHK024 - 同一ユーザーの複数デバイス同時ログイン要件が定義されているか？ [Gap]
- [ ] CHK025 - セッションハイジャック対策の要件が定義されているか？ [Gap, Security]

## エッジケース・例外フロー (Edge Cases & Exception Flows)

- [ ] CHK026 - OAuth 認証失敗時のフォールバック動作が定義されているか？ [Coverage, Spec §エラーハンドリング]
- [ ] CHK027 - Supabase Auth サービス障害時の動作要件が定義されているか？ [Gap, Exception Flow]
- [ ] CHK028 - 管理者パスワード変更時の既存セッション無効化要件が定義されているか？ [Gap]
- [ ] CHK029 - admin_role がデータベースで変更された際のリアルタイム反映要件が定義されているか？ [Gap]
- [ ] CHK030 - 権限昇格攻撃への対策要件が定義されているか？ [Gap, Security]

## 機密情報管理 (Sensitive Data Handling)

- [ ] CHK031 - 環境変数 (EXPO_PUBLIC_*) のクライアント露出リスクが評価されているか？ [Gap, Security]
  - ⚠️ **懸念**: EXPO_PUBLIC_ プレフィックス付き変数はクライアントバンドルに含まれる
- [ ] CHK032 - Supabase Anon Key の適切な使用範囲が定義されているか？ [Clarity]
- [ ] CHK033 - パスワードハッシュの保存場所 (app_settings) への RLS 制限が定義されているか？ [Gap, Security]

## 監査要件 (Audit Requirements)

- [ ] CHK034 - ログイン/ログアウトイベントのログ記録要件が定義されているか？ [Gap]
- [ ] CHK035 - 管理者権限取得イベントのログ記録要件が定義されているか？ [Gap]
- [ ] CHK036 - 認証失敗イベントのログ記録要件が定義されているか？ [Gap]

---

## 検出された要件上の問題

### 矛盾 (Conflicts)

1. **CHK010/CHK023**: 仕様書に「管理者フラグは sessionStorage で管理」と記載があるが、admin_role カラムがDB設計にも存在。永続化方針が不明確。

### 曖昧性 (Ambiguities)

1. **CHK009**: 管理者パスワードモーダルが毎回表示されるのか、一度認証したら永続するのか不明。
2. **CHK008**: SHA-256 ハッシュは現代のセキュリティ基準では不十分（bcrypt/Argon2 推奨）。

### ギャップ (Gaps)

1. セッション有効期限・タイムアウトの要件なし
2. パスワード入力失敗時のロックアウト要件なし
3. 監査ログ要件なし
4. 権限昇格攻撃対策の明示なし

---

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items marked with ⚠️ indicate security concerns requiring spec clarification
- [Gap] markers indicate missing requirements that should be added to spec
- [Conflict] markers indicate contradictory requirements needing resolution
