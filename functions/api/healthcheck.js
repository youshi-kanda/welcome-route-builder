// functions/api/healthcheck.js
export const onRequest = async ({ env }) => {
  return new Response(JSON.stringify({
    status: 'success',
    message: 'Cloudflare Functions動作確認OK！',
    timestamp: new Date().toISOString(),
    gasConfigured: env.GAS_URL ? 'configured' : 'not configured',
    project: 'alsok-interview-demo'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
