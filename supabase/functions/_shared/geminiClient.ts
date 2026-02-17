/**
 * @fileoverview Gemini REST API クライアント
 * @description AI判定処理で使用する Gemini API ラッパー。
 *              base64 チャンクエンコード、構造化 JSON 出力、リスクスコア計算を提供。
 * @module supabase/functions/_shared/geminiClient
 */

/** チェック項目の型 */
interface CheckItem {
  item_code: string;
  item_name: string;
  description: string;
  category: string;
  risk_weight: number;
}

/** Gemini から返される個別判定結果 */
interface ItemResult {
  item_code: string;
  flagged: boolean;
  reason: string;
}

/** analyzeWithGemini の返却型 */
export interface GeminiResult {
  skipped: boolean;
  reason?: string;
  ai_risk_score: number | null;
  ai_risk_details: ItemResult[] | null;
}

/** base64 エンコード時のチャンクサイズ（引数上限回避） */
const BASE64_CHUNK_SIZE = 8192;

/** Gemini inline_data の上限バイト数（20MB） */
const GEMINI_INLINE_DATA_LIMIT = 20 * 1024 * 1024;

/**
 * Uint8Array を base64 文字列にエンコード（チャンク方式）
 * @description String.fromCharCode の引数上限を回避するため 8192 バイトずつ処理
 */
function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * リスクスコアを計算
 * @description フラグ付き項目の weight 合計から 0-100 のスコアを算出
 */
function calculateRiskScore(results: ItemResult[], checkItems: CheckItem[]): number {
  const weightMap = new Map(checkItems.map((ci) => [ci.item_code, ci.risk_weight]));
  const totalWeightSum = checkItems.reduce((sum, ci) => sum + ci.risk_weight, 0);
  if (totalWeightSum === 0) return 0;
  const flaggedWeightSum = results
    .filter((r) => r.flagged)
    .reduce((sum, r) => sum + (weightMap.get(r.item_code) ?? 0), 0);
  return Math.min(100, Math.round((flaggedWeightSum / totalWeightSum) * 100));
}

/**
 * Gemini API でファイルを解析
 * @param fileBytes - ファイルのバイナリデータ
 * @param mimeType - ファイルの MIME タイプ
 * @param checkItems - チェック項目一覧
 * @returns AI 判定結果
 */
export async function analyzeWithGemini(
  fileBytes: Uint8Array,
  mimeType: string,
  checkItems: CheckItem[]
): Promise<GeminiResult> {
  // ファイルサイズチェック（Gemini inline_data 上限 20MB）
  if (fileBytes.length > GEMINI_INLINE_DATA_LIMIT) {
    return {
      skipped: true,
      reason: 'file_too_large_for_ai',
      ai_risk_score: null,
      ai_risk_details: null,
    };
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return {
      skipped: true,
      reason: 'gemini_api_key_not_configured',
      ai_risk_score: null,
      ai_risk_details: null,
    };
  }

  const base64Data = encodeBase64(fileBytes);

  const checkItemsForPrompt = checkItems.map((ci) => ({
    item_code: ci.item_code,
    item_name: ci.item_name,
    description: ci.description,
    category: ci.category,
  }));

  const prompt = `あなたは大学祭の情宣物の審査担当AIです。
アップロードされたファイルを以下のルールリストに照らして確認し、
各ルールに違反しているかどうかを判定してください。

ルールリスト（JSON）:
${JSON.stringify(checkItemsForPrompt, null, 2)}

回答形式（必ずこの形式のJSONで回答してください）:
{ "results": [{ "item_code": "...", "flagged": true/false, "reason": "..." }] }

- flagged: そのルールに違反している場合 true、問題なければ false
- reason: flagged が true の場合は違反の具体的な理由を日本語で記載、false の場合は空文字
- すべてのルールについて回答してください`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    return {
      skipped: true,
      reason: 'api_error',
      ai_risk_score: null,
      ai_risk_details: null,
    };
  }

  const json = await response.json();

  // Gemini レスポンスからテキスト部分を抽出
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Gemini response missing text:', JSON.stringify(json));
    return {
      skipped: true,
      reason: 'empty_response',
      ai_risk_score: null,
      ai_risk_details: null,
    };
  }

  let parsed: { results?: ItemResult[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error('Gemini returned invalid JSON:', text.slice(0, 200));
    return {
      skipped: true,
      reason: 'empty_response',
      ai_risk_score: null,
      ai_risk_details: null,
    };
  }
  const results: ItemResult[] = parsed.results ?? [];

  const aiRiskScore = calculateRiskScore(results, checkItems);

  return {
    skipped: false,
    ai_risk_score: aiRiskScore,
    ai_risk_details: results,
  };
}
