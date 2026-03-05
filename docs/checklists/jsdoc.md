# JSDoc コメント要件チェックリスト: 生駒祭 情宣AI判定システム

**Purpose**: JSDoc形式の日本語コメントによるリバースエンジニアリング容易性の要件品質検証
**Created**: 2026-01-25
**Feature**: [docs/spec.md](../spec.md)
**Focus**: 関数・クラス設計、依存関係・アーキテクチャ、ビジネスロジック説明

**Note**: このチェックリストは**要件自体の品質**（完全性・明確性・一貫性）を検証するものです。実装の動作確認ではありません。

---

## 関数シグネチャ要件の完全性 (Function Signature Completeness)

- [ ] CHK001 - 各関数・フックの@param要件が仕様書に明記されているか？（型、必須/任意、デフォルト値） [Completeness, Gap]
- [ ] CHK002 - @returns/@return の戻り値型と意味の要件が定義されているか？ [Completeness, Gap]
- [ ] CHK003 - @throws/@exception で投げる可能性のある例外の要件が仕様書にあるか？ [Completeness, Spec §エラーハンドリング設計]
- [ ] CHK004 - @async 関数の非同期動作要件が明確に定義されているか？ [Clarity, Spec §Edge Functions]
- [ ] CHK005 - カスタムフック (useXxx) の入出力インターフェース要件が定義されているか？ [Completeness, Spec §features/*/hooks/]

## コンポーネント設計要件の明確性 (Component Design Clarity)

- [ ] CHK006 - 各React コンポーネントの props 要件が明確に定義されているか？ [Clarity, Spec §ディレクトリ構造]
- [ ] CHK007 - コンポーネントの責務範囲（単一責任）の要件が仕様書で明確か？ [Clarity, Gap]
- [ ] CHK008 - 画面コンポーネント（*Screen.jsx）と子コンポーネントの関係要件が定義されているか？ [Completeness, Spec §feature ディレクトリの構成ルール]
- [ ] CHK009 - 共有コンポーネント（src/shared/components/）の再利用条件が明記されているか？ [Clarity, Spec §shared/]
- [ ] CHK010 - ErrorBoundary のエラー捕捉範囲と伝播要件が明確か？ [Clarity, Spec §Error Boundary アーキテクチャ]

## 依存関係・アーキテクチャ要件 (Dependency & Architecture Requirements)

- [ ] CHK011 - @module/@namespace によるモジュール境界の要件が定義されているか？ [Gap]
- [ ] CHK012 - @requires/@import で示す外部依存の要件が仕様書にあるか？ [Completeness, Spec §依存パッケージ]
- [ ] CHK013 - Context Provider の階層構造と依存順序の要件が明確か？ [Clarity, Spec §認証・権限管理設計]
- [ ] CHK014 - feature 間の依存禁止ルール（循環依存防止）が要件として定義されているか？ [Gap]
- [ ] CHK015 - services/ と features/ の境界と呼び出し方向の要件が明記されているか？ [Clarity, Spec §services/]

## ビジネスロジック説明要件 (Business Logic Documentation Requirements)

- [ ] CHK016 - リスクスコア計算ロジック（0-100%）の算出方法要件が明記されているか？ [Completeness, Spec §正式提出]
- [ ] CHK017 - 1日3回制限のカウントリセットタイミング（JST 0:00）の要件が明確か？ [Clarity, Spec §Clarifications]
- [ ] CHK018 - 管理者権限による表示切替ロジック（koho/kikaku/super）の要件が明記されているか？ [Completeness, Spec §管理者権限構造]
- [ ] CHK019 - AI判定スキップ時のフォールバック動作の要件が定義されているか？ [Completeness, Spec §AI 判定エラー時のフォールバック]
- [ ] CHK020 - 楽観的ロック（version カラム）の競合検出要件が明確か？ [Clarity, Spec §submissions テーブル]

## 副作用・状態変更要件 (Side Effects & State Change Requirements)

- [ ] CHK021 - @fires/@emits で示すイベント発火の要件が定義されているか？ [Gap]
- [ ] CHK022 - @modifies で示す状態変更（Context、DB）の範囲要件が明記されているか？ [Gap]
- [ ] CHK023 - Google Drive 操作時の副作用（ファイル作成/削除）要件が明確か？ [Completeness, Spec §ファイル保存]
- [ ] CHK024 - 提出削除時のDB＋Drive同時削除のトランザクション要件が定義されているか？ [Clarity, Spec §提出削除機能]

## 型定義・定数要件 (Type Definition & Constants Requirements)

- [ ] CHK025 - @typedef によるカスタム型（Submission, Profile等）の要件が明記されているか？ [Completeness, Spec §データベース設計]
- [ ] CHK026 - @enum で定義すべき列挙値（status, admin_role等）の要件が明確か？ [Clarity, Spec §ユーザー種別]
- [ ] CHK027 - @constant で示す定数（事前チェック上限等）の要件が仕様書にあるか？ [Completeness, Spec §app_settings テーブル]

## 使用例・サンプル要件 (Usage Example Requirements)

- [ ] CHK028 - @example によるフック・関数の使用例要件が定義されているか？ [Gap]
- [ ] CHK029 - 複雑なAPIコール（Edge Functions）の呼び出し例要件が明記されているか？ [Clarity, Spec §Supabase Edge Functions]

---

## 検出された要件上の問題

### ギャップ (Gaps)

1. **CHK001, CHK002**: 各関数の入出力仕様が仕様書に明示されていない（ファイル名のみ記載）
2. **CHK011, CHK014**: モジュール境界と循環依存防止ルールが明文化されていない
3. **CHK021, CHK022**: イベント発火・状態変更の副作用要件が未定義
4. **CHK028**: 使用例の記載要件がない

### 曖昧性 (Ambiguities)

1. **CHK007**: コンポーネントの責務範囲が「機能ごとにまとめる」以上の具体性がない
2. **CHK015**: services/ と features/ の境界は暗黙的で明文化されていない

---

## Notes

- チェック完了時は `[x]` にマーク
- コメントや発見事項はインラインで追記
- [Gap] は仕様書に追加すべき要件を示す
- [Clarity] は既存要件の明確化が必要な項目を示す
