import { API_KEY, SCOPE, PROC_NOTIFY_EVENT, PROC_NOTIFY_SIGNATURE, PROC_NOTIFY_SIGNATURE_FREE, PROC_VALIDATE_DNI_WITH_PHOTO, PROC_CREATE_ADDRESS, PROC_VALIDATE_LINK_ACCESS, PROXY_PHP_URL } from './env';

type Param = { name: string; value: string };

async function postExec(processId: string, params: Param[]) {
  // Proxy dinámico: dev usa Next.js API route; prod usa PHP proxy
  const isBrowser = typeof window !== 'undefined';
  const isDev = isBrowser && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  
  // En desarrollo local, usar la API route de Next.js
  // En producción, usar el proxy PHP en cPanel
  // Con basePath: '/app', la ruta debe incluir el basePath
  const proxyUrl = isDev ? '/app/api/exec' : PROXY_PHP_URL;
  const payload = isDev 
    ? { process: processId, token: API_KEY, scope: SCOPE, params }
    : { process: processId, params }; // El PHP proxy agrega token y scope automáticamente

  console.log('[DEBUG] postExec: Enviando request:', {
    processId,
    proxyUrl,
    isDev,
    payloadSize: JSON.stringify(payload).length,
    paramsCount: params.length
  });

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  console.log('[DEBUG] postExec: Respuesta HTTP:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    headers: Object.fromEntries(res.headers.entries())
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[DEBUG] postExec: Error HTTP:', { status: res.status, text });
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  
  const responseText = await res.text();
  console.log('[DEBUG] postExec: Respuesta texto:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
  
  try {
    const responseData = JSON.parse(responseText);
    console.log('[DEBUG] postExec: JSON parseado exitosamente:', responseData);
    return responseData;
  } catch (parseError) {
    console.error('[DEBUG] postExec: Error parseando JSON:', parseError);
    // Devolver un objeto de error estructurado
    return {
      error: 'invalid_json',
      http: res.status,
      rawResponse: responseText,
      parseError: parseError instanceof Error ? parseError.message : String(parseError)
    };
  }
}

export async function notifyEvent05({ photo, email, dni, f1, address, key }: { photo: string; email: string; dni: string; f1: string; address: string; key: string; }) {
  const params: Param[] = [
    { name: 'photo', value: photo },
    { name: 'email', value: email },
    { name: 'dni', value: dni },
    { name: 'f1', value: f1 },
    { name: 'address', value: address },
    { name: 'key', value: key },
  ];
  return postExec(PROC_NOTIFY_EVENT, params);
}

export async function validateDNIWithPhoto04({ photoFace, photoDNI, email, f1, address }: { photoFace: string; photoDNI: string; email: string; f1: string; address: string; }) {
  const params: Param[] = [
    { name: 'photoFace', value: photoFace },
    { name: 'photoDNI', value: photoDNI },
    { name: 'email', value: email },
    { name: 'f1', value: f1 },
    { name: 'address', value: address },
  ];
  const resp = await postExec(PROC_VALIDATE_DNI_WITH_PHOTO, params);
  return resp;
}

export async function createAddressForWeb(imei: string) {
  const params: Param[] = [ { name: 'imei', value: imei } ];
  return postExec(PROC_CREATE_ADDRESS, params);
}

export async function notifyEventSignature({ 
  photo, 
  email, 
  dni, 
  f1, 
  address, 
  key, 
  signature, 
  signaturevector, 
  name 
}: { 
  photo: string; 
  email: string; 
  dni: string; 
  f1: string; 
  address: string; 
  key: string; 
  signature: string; 
  signaturevector: string; 
  name: string; 
}) {
  const params: Param[] = [
    { name: 'photo', value: photo },
    { name: 'email', value: email },
    { name: 'dni', value: dni },
    { name: 'f1', value: f1 },
    { name: 'address', value: address },
    { name: 'key', value: key },
    { name: 'signature', value: signature },
    { name: 'signaturevector', value: signaturevector },
    { name: 'name', value: name },
  ];
  return postExec(PROC_NOTIFY_SIGNATURE, params);
}

export async function notifyEventSignatureFree({ 
  email, 
  dni, 
  f1, 
  address, 
  key, 
  signature, 
  signaturevector, 
  name 
}: { 
  email: string; 
  dni: string; 
  f1: string; 
  address: string; 
  key: string; 
  signature: string; 
  signaturevector: string; 
  name: string; 
}) {
  const params: Param[] = [
    { name: 'email', value: email },
    { name: 'dni', value: dni },
    { name: 'f1', value: f1 },
    { name: 'address', value: address },
    { name: 'key', value: key },
    { name: 'signature', value: signature },
    { name: 'signaturevector', value: signaturevector },
    { name: 'name', value: name },
  ];
  return postExec(PROC_NOTIFY_SIGNATURE_FREE, params);
}

/**
 * Valida si un link generado tiene acceso válido
 * @param code - Código del flujo (04, 05, etc.)
 * @param dni - DNI del usuario
 * @param key - KEY/Firma del QR (0x1234...)
 * @returns Promise con { isValid: boolean }
 */
export async function validateLinkAccess({ code, dni, key }: { code: string; dni: string; key: string; }) {
  const params: Param[] = [
    { name: 'value1', value: code }, // Código del flujo (04, 05)
    { name: 'value2', value: dni },   // DNI
    { name: 'value3', value: key },   // KEY/Firma (0x1234...)
  ];
  return postExec(PROC_VALIDATE_LINK_ACCESS, params);
}

