// External Charity API utility for React
// Uses browser crypto.subtle for SHA256 and base64 encoding (Dart-style signature)

const API_URL = 'https://stg.foodservices.openapipaas.com/api/v1/common/social-ewallet/charities?page=0';
const API_KEY = 'r4TEOYgoqurHaCR3sLFC';
const PROJECT_ID = '205d6cbd-db6c-4dc0-9522-cf011e0dd34c';
const PLATFORM_SYSCODE = '101';
const BASE_URL = 'https://stg.foodservices.openapipaas.com/api/v1';
const SECRET_KEY = 'tIe7GAzhHPOxGxHnH41E'; // <-- Replace with your actual secret key

// Helper: SHA256 hash, returns base64 string
async function sha256Base64(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// Main fetch function (Dart-style signature)
export async function getExternalCharities() {
  const method = 'GET';
  const url = new URL(API_URL);
  const urlPathQuery = url.pathname + url.search;
  const isoNow = new Date().toISOString();
  const host = new URL(BASE_URL).host;
  const body = {};
  const bodyJson = JSON.stringify(body);
  const contentHash = await sha256Base64(bodyJson);

  const signedHeaders = 'datetime|host|project-id|platform-syscode|content-sha256';
  const stringToSign = `${method}\n${urlPathQuery}\n${isoNow}|${host}|${PROJECT_ID}|${PLATFORM_SYSCODE}|${contentHash}`;

  // Signature: sha256(stringToSign + secretKey), base64
  const signatureInput = stringToSign + SECRET_KEY;
  const signature = await sha256Base64(signatureInput);

  const headers = {
    'datetime': isoNow,
    'content-sha256': contentHash,
    'Authorization': `HMAC-SHA256 Credential=${API_KEY}&SignedHeaders=${signedHeaders}&Signature=${signature}`,
    'api-key': API_KEY,
    'project-id': PROJECT_ID,
    'platform-syscode': PLATFORM_SYSCODE,
    'Content-Type': 'application/json',
  };

  const res = await fetch(API_URL, { method, headers });
  if (!res.ok) throw new Error('Failed to fetch charities: ' + res.status);
  const json = await res.json();
  return (json.result && Array.isArray(json.result.data)) ? json.result.data : [];
} 