// Cliente - valores por defecto para desarrollo
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://manyao.pe/app/api';
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'demo-key';
export const SCOPE = process.env.NEXT_PUBLIC_SCOPE || 'demo-scope';
export const PROC_VALIDATE_FACE = process.env.NEXT_PUBLIC_VALIDATE_FACE_PROCESS_ID || 'demo-validate-face';
export const PROC_VALIDATE_DNI_WITH_PHOTO = process.env.NEXT_PUBLIC_VALIDATE_DNI_WITH_PHOTO_PROCESS_ID || 'demo-validate-dni';
export const PROC_NOTIFY_EVENT = process.env.NEXT_PUBLIC_NOTIFY_EVENT_PROCESS_ID || 'demo-notify-event';
export const PROC_NOTIFY_SIGNATURE = process.env.NEXT_PUBLIC_NOTIFY_SIGNATURE_PROCESS_ID || 'demo-notify-signature';
export const PROC_NOTIFY_SIGNATURE_FREE = process.env.NEXT_PUBLIC_NOTIFY_SIGNATURE_FREE_PROCESS_ID || 'demo-notify-signature-free';
export const PROC_CREATE_ADDRESS = process.env.NEXT_PUBLIC_CREATE_ADDRESS_PROCESS_ID || 'demo-create-address';
export const PROC_VALIDATE_LINK_ACCESS = process.env.NEXT_PUBLIC_VALIDATE_LINK_ACCESS_PROCESS_ID || '9404ee51-03f4-4d1d-b248-c61500145f9e';

// URLs del sitio y proxy
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://manyao.pe';
export const PROXY_PHP_URL = process.env.NEXT_PUBLIC_PROXY_PHP_URL || 'https://manyao.pe/app/api/exec.php';

// Servidor (Route Handlers): usar variables sin prefijo si existen
export const SERVER_API_BASE = process.env.STAMPING_API_BASE_URL || API_BASE;
export const SERVER_API_KEY = process.env.STAMPING_API_KEY || API_KEY;
export const SERVER_SCOPE = process.env.STAMPING_SCOPE || SCOPE;


