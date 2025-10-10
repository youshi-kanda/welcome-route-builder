/**
 * ALSOK採用システム - Cloudflare Functions CORSプロキシ
 */
export const onRequest = async ({ request, env }) => {
  const origin = request.headers.get('Origin') || '*';
  
  // OPTIONSリクエスト（プリフライト）対応
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // GAS URL確認
  const gasUrl = env.GAS_URL;
  if (!gasUrl) {
    return new Response(JSON.stringify({
      success: false,
      error: 'GAS_URL環境変数が設定されていません',
      message: 'Cloudflare Pagesの環境変数でGAS_URLを設定してください'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    let body = '';
    let targetUrl = gasUrl;
    
    // リクエストボディ取得
    if (request.method === 'POST') {
      body = await request.text();
    } else if (request.method === 'GET') {
      const url = new URL(request.url);
      const params = url.searchParams;
      if (params.toString()) {
        targetUrl += '?' + params.toString();
      }
    }
    
    // GASへリクエスト転送
    const gasResponse = await fetch(targetUrl, {
      method: request.method,
      headers: { 
        'Content-Type': 'text/plain'
      },
      body: request.method === 'POST' ? body : undefined
    });
    
    const responseText = await gasResponse.text();
    
    // CORS対応レスポンス返却
    return new Response(responseText, {
      status: gasResponse.status,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'GAS連携中にエラーが発生しました',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    });
  }
};
