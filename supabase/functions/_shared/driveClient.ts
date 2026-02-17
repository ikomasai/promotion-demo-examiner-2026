/**
 * @fileoverview Google Drive REST API v3 クライアント
 * @description Edge Functions で使用する Google Drive 操作ラッパー。
 *              googleapis パッケージは使わず、REST API 直接呼び出し（Edge Function 10MB 制限対策）。
 *              RS256 JWT でサービスアカウント認証、トークンキャッシュ付き。
 * @module supabase/functions/_shared/driveClient
 */

/** トークンキャッシュ */
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * PEM 形式の秘密鍵を CryptoKey にインポート
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryString = atob(pemBody);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Base64URL エンコード
 */
function base64url(data: Uint8Array | string): string {
  const input = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  const binary = String.fromCharCode(...input);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * サービスアカウント JWT でアクセストークンを取得
 * @description モジュールレベルでキャッシュし、期限5分前に再取得
 */
export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // キャッシュが有効なら再利用（期限5分前まで）
  if (cachedToken && tokenExpiresAt > now + 300) {
    return cachedToken;
  }

  const saJson = Deno.env.get('GOOGLE_DRIVE_SERVICE_ACCOUNT');
  if (!saJson) {
    throw new Error('drive_not_configured');
  }

  const sa = JSON.parse(saJson);
  const privateKey = await importPrivateKey(sa.private_key);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    signingInput,
  );
  const jwt = `${header}.${payload}.${base64url(new Uint8Array(signature))}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Token exchange failed:', resp.status, errText);
    throw new Error('drive_token_error');
  }

  const tokenData = await resp.json();
  cachedToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in ?? 3600);
  return cachedToken!;
}

/**
 * Google Drive API リクエスト（リトライ付き）
 * @description 401 → トークン再取得1回、429 → 指数バックオフ最大3回
 */
async function driveRequest(
  url: string,
  init: RequestInit,
  accessToken: string,
  retryCount = 0,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const resp = await fetch(url, { ...init, headers });

  // 401: トークン無効 → 1回だけ再取得してリトライ
  if (resp.status === 401 && retryCount === 0) {
    cachedToken = null;
    tokenExpiresAt = 0;
    const newToken = await getAccessToken();
    return driveRequest(url, init, newToken, retryCount + 1);
  }

  // 429: レート制限 → 指数バックオフ（1s, 2s, 4s）最大3回
  if (resp.status === 429 && retryCount < 3) {
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((r) => setTimeout(r, delay));
    return driveRequest(url, init, accessToken, retryCount + 1);
  }

  return resp;
}

/**
 * フォルダを再帰的に確保（なければ作成）
 * @param accessToken - アクセストークン
 * @param pathSegments - フォルダパス（例: ['生駒祭2026', '企画物', '団体名']）
 * @param rootFolderId - ルートフォルダ ID
 * @returns 最下層フォルダの ID
 */
export async function ensureFolder(
  accessToken: string,
  pathSegments: string[],
  rootFolderId: string,
): Promise<string> {
  let parentId = rootFolderId;

  for (const segment of pathSegments) {
    // 既存フォルダを検索
    const query = `name='${segment.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchResp = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      { method: 'GET' },
      accessToken,
    );

    if (!searchResp.ok) {
      const errText = await searchResp.text();
      throw new Error(`Drive folder search failed: ${searchResp.status} ${errText}`);
    }

    const searchData = await searchResp.json();
    if (searchData.files?.length > 0) {
      parentId = searchData.files[0].id;
    } else {
      // フォルダ作成
      const createResp = await driveRequest(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: segment,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
          }),
        },
        accessToken,
      );

      if (!createResp.ok) {
        const errText = await createResp.text();
        throw new Error(`Drive folder create failed: ${createResp.status} ${errText}`);
      }

      const created = await createResp.json();
      parentId = created.id;
    }
  }

  return parentId;
}

/**
 * ファイルをアップロード（multipart upload）
 * @returns アップロードされたファイルの ID
 */
export async function uploadFile(
  accessToken: string,
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
  folderId: string,
): Promise<string> {
  const boundary = '---drive-upload-boundary---';
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  // multipart/related リクエストボディを構築
  const metadataPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
  );
  const filePart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metadataPart.length + filePart.length + fileBytes.length + endPart.length);
  let offset = 0;
  body.set(metadataPart, offset); offset += metadataPart.length;
  body.set(filePart, offset); offset += filePart.length;
  body.set(fileBytes, offset); offset += fileBytes.length;
  body.set(endPart, offset);

  const resp = await driveRequest(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
    accessToken,
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Drive upload failed: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  return data.id;
}

/**
 * ファイルを「リンクを知っている全員が閲覧可」に共有し、webViewLink を返す
 * @returns webViewLink（共有 URL）
 */
export async function shareFile(
  accessToken: string,
  fileId: string,
): Promise<string> {
  // パーミッション作成（anyone, reader）
  const permResp = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    },
    accessToken,
  );

  if (!permResp.ok) {
    const errText = await permResp.text();
    console.error('Drive permission create failed:', permResp.status, errText);
    // パーミッション失敗でもリンクは取得を試みる
  }

  // webViewLink を取得
  const fileResp = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
    { method: 'GET' },
    accessToken,
  );

  if (!fileResp.ok) {
    const errText = await fileResp.text();
    throw new Error(`Drive get webViewLink failed: ${fileResp.status} ${errText}`);
  }

  const fileData = await fileResp.json();
  return fileData.webViewLink;
}

/**
 * ファイルを削除（ベストエフォート）
 */
export async function deleteFile(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const resp = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    { method: 'DELETE' },
    accessToken,
  );

  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text();
    console.error('Drive delete failed:', resp.status, errText);
  }
}
