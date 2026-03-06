/**
 * @fileoverview Google Docs レポート生成クライアント
 * @description 正式提出時に AI 判定結果を Google Docs として自動生成する。
 *              driveClient.ts の shareFile() を再利用。
 *              drive スコープで Docs API にもアクセス可能（追加スコープ不要）。
 * @module supabase/functions/_shared/docsClient
 */

import { shareFile } from './driveClient.ts';

/** チェック項目の型（checkItems.ts と同一） */
interface CheckItem {
  item_code: string;
  item_name: string;
  category: string;
}

/** AI 判定結果の項目 */
interface ItemResult {
  item_code: string;
  flagged: boolean;
  reason: string;
}

/** createReportDoc のパラメータ */
interface ReportParams {
  title: string;
  orgName: string;
  projName: string;
  submissionType: string;
  submitterEmail: string;
  submittedAt: string;
  aiRiskScore: number | null;
  aiRiskDetails: ItemResult[] | null;
  checkItems: CheckItem[];
  skipped: boolean;
  skipReason?: string;
  driveFileUrl: string | null;
  folderId: string;
}

/**
 * リスクレベルのラベルを返す
 */
function getRiskLabel(score: number | null): string {
  if (score === null) return '判定なし';
  if (score <= 10) return '低リスク';
  if (score <= 50) return '中リスク';
  return '高リスク';
}

/**
 * ISO 文字列を JST 表示用に変換
 */
function formatJST(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

/**
 * レポート本文テキストを構築
 */
function buildReportBody(params: ReportParams): string {
  const destLabel = params.submissionType === 'kikaku' ? '企画管理部' : '広報部';
  const submittedAtJST = formatJST(params.submittedAt);
  const nowJST = formatJST(new Date().toISOString());

  let body = '';

  body += 'AI 判定レポート\n\n';

  body += '■ 提出情報\n';
  body += `団体名:　　${params.orgName}\n`;
  body += `企画名:　　${params.projName}\n`;
  body += `提出先:　　${destLabel}\n`;
  body += `提出者:　　${params.submitterEmail}\n`;
  body += `提出日時:　${submittedAtJST}\n\n`;

  body += '■ AI リスクスコア\n';
  if (params.skipped) {
    body += `AI判定スキップ: ${params.skipReason || '不明'}\n\n`;
  } else {
    body += `${params.aiRiskScore}% (${getRiskLabel(params.aiRiskScore)})\n\n`;
  }

  body += '■ チェック項目判定結果\n';
  body += '項目コード | 項目名 | カテゴリ | 判定 | 理由\n';
  body += '─── | ─── | ─── | ─── | ───\n';

  const detailsMap = new Map(
    (params.aiRiskDetails ?? []).map((d) => [d.item_code, d]),
  );

  for (const ci of params.checkItems) {
    const detail = detailsMap.get(ci.item_code);
    const judgment = detail ? (detail.flagged ? 'NG' : 'OK') : '-';
    const reason = detail?.flagged ? detail.reason : '';
    body += `${ci.item_code} | ${ci.item_name} | ${ci.category} | ${judgment} | ${reason}\n`;
  }
  body += '\n';

  body += '■ 提出ファイル\n';
  body += `${params.driveFileUrl || '(アップロードなし)'}\n\n`;

  body += '───\n';
  body += `生成日時: ${nowJST}\n`;
  body += 'このレポートはシステムにより自動生成されました。\n';

  return body;
}

/**
 * Google Docs API リクエストヘルパー
 */
async function docsRequest(
  url: string,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers });
}

/**
 * AI 判定レポートを Google Docs として作成し、指定フォルダに配置して共有する
 * @param accessToken - Google API アクセストークン
 * @param params - レポートパラメータ
 * @returns docsId と docsUrl
 */
export async function createReportDoc(
  accessToken: string,
  params: ReportParams,
): Promise<{ docsId: string; docsUrl: string }> {
  // 1. ドキュメント新規作成
  const createResp = await docsRequest(
    'https://docs.googleapis.com/v1/documents',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: params.title }),
    },
    accessToken,
  );

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(`Docs create failed: ${createResp.status} ${errText}`);
  }

  const doc = await createResp.json();
  const docId: string = doc.documentId;

  // 2. フォルダに移動（root → 指定フォルダ）
  const moveResp = await docsRequest(
    `https://www.googleapis.com/drive/v3/files/${docId}?addParents=${params.folderId}&removeParents=root&supportsAllDrives=true`,
    { method: 'PATCH' },
    accessToken,
  );

  if (!moveResp.ok) {
    console.error('Docs folder move failed:', moveResp.status, await moveResp.text());
  }

  // 3. 本文挿入 + 見出しスタイル適用
  const bodyText = buildReportBody(params);

  const requests: unknown[] = [
    {
      insertText: {
        location: { index: 1 },
        text: bodyText,
      },
    },
  ];

  // タイトル行に HEADING_1
  const titleLine = 'AI 判定レポート\n';
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: 1, endIndex: 1 + titleLine.length },
      paragraphStyle: { namedStyleType: 'HEADING_1' },
      fields: 'namedStyleType',
    },
  });

  // セクション見出しに HEADING_2
  const sections = ['■ 提出情報', '■ AI リスクスコア', '■ チェック項目判定結果', '■ 提出ファイル'];
  for (const heading of sections) {
    const idx = bodyText.indexOf(heading);
    if (idx >= 0) {
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: 1 + idx,
            endIndex: 1 + idx + heading.length + 1,
          },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      });
    }
  }

  const batchResp = await docsRequest(
    `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    },
    accessToken,
  );

  if (!batchResp.ok) {
    console.error('Docs batchUpdate failed:', batchResp.status, await batchResp.text());
  }

  // 4. 共有 + webViewLink 取得（driveClient.shareFile 再利用）
  const docsUrl = await shareFile(accessToken, docId);

  return { docsId: docId, docsUrl };
}
