"use client";
import { Suspense } from 'react';
import { useEffect, useState, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseQR } from '@/lib';
import { createAddressForWeb, notifyEventSignature, notifyEventSignatureFree, validateLinkAccess } from '@/lib/api';
import toast from 'react-hot-toast';

// Componentes reutilizables
import DNIInputScreen from '@/components/DNIInputScreen';
import ChoiceScreen from '@/components/ChoiceScreen';
import CameraScreen from '@/components/CameraScreen';
import CameraPreview from '@/components/CameraPreview';
import SignatureScreen from '@/components/SignatureScreen';
import ValidationResultCard from '@/components/ValidationResultCard';
import DocumentViewer from '@/components/DocumentViewer';
import ThemeToggle from '@/components/ThemeToggle';
import ProgressIndicator from '@/components/ProgressIndicator';
import Logo from '@/components/Logo';


// Función para limpiar mensajes del API
const cleanApiMessage = (message: string): string => {
  if (!message) return 'Error desconocido';
  
  // Remover códigos como [If_Do_4] => 
  let cleaned = message.replace(/^\[.*?\]\s*=>\s*/, '');
  
  // Corregir problemas de codificación de caracteres especiales
  cleaned = cleaned
    .replace(/Validaci\?n/g, 'Validación')
    .replace(/identificaci\?n/g, 'identificación')
    .replace(/autenticaci\?n/g, 'autenticación')
    .replace(/verificaci\?n/g, 'verificación')
    .replace(/confirmaci\?n/g, 'confirmación')
    .replace(/autenticaci\?n/g, 'autenticación')
    .replace(/\?/g, 'ó') // Fallback para otros caracteres mal codificados
    .replace(/á/g, 'á')
    .replace(/é/g, 'é')
    .replace(/í/g, 'í')
    .replace(/ú/g, 'ú');
  
  // Limpiar espacios extra
  cleaned = cleaned.trim();
  
  return cleaned || 'Error desconocido';
};

// Interfaz para la respuesta del API
interface ApiResponse {
  code?: number;
  message?: string;
  response?: {
    isValid?: string | boolean;
    isLive?: string | boolean;
    names?: string;
    paternal_surname?: string;
    maternal_surname?: string;
    validity?: string;
    auth_id?: string;
    file?: string;
    message?: string;
    resp?: {
      status?: boolean;
      result?: string;
      message?: string;
      jsonResult?: {
        datos?: string[];
      };
    };
    live?: {
      result?: string;
      message?: string;
      jsonResult?: {
        probability?: number;
        quality?: number;
        score?: number;
      };
    };
  };
}

// Función para determinar el resultado basado en la respuesta del API
const determineValidationResult = (resp: ApiResponse, documentId?: string) => {
  const response = resp?.response;
  
  // Verificar si la respuesta HTTP fue exitosa
  const httpSuccess = resp?.code === 200;
  
  if (!httpSuccess) {
    // Error HTTP (ej: code 302, 400, 500, etc.)
    const rawMessage = resp?.message || 'Error al procesar la solicitud';
    return {
      success: false,
      message: cleanApiMessage(rawMessage),
      type: 'http_error'
    };
  }
  
  // Verificar campos específicos de validación
  const isValid = response?.isValid;
  const isLive = response?.isLive;
  
  // Caso 1: Validación exitosa - verificar por mensaje de éxito en lugar de solo códigos
  const validationMessage = response?.resp?.result || '';
  
  // Detectar alta probabilidad (mayor a 75%) desde live.jsonResult.probability
  const liveProbability = response?.live?.jsonResult?.probability;
  const hasHighProbability = liveProbability && liveProbability >= 0.75;
  
  // También buscar porcentajes en el mensaje de texto
  const highProbabilityMatch = validationMessage.match(/(\d+)%/);
  const hasHighProbabilityInMessage = highProbabilityMatch && parseInt(highProbabilityMatch[1]) >= 75;
  
  const isSuccessByMessage = validationMessage.includes('coincide') || 
                            validationMessage.includes('exitoso') || 
                            validationMessage.includes('válido') ||
                            validationMessage.includes('validado') ||
                            validationMessage.includes('correcto') ||
                            validationMessage.includes('match') ||
                            hasHighProbability ||
                            hasHighProbabilityInMessage ||
                            (validationMessage.includes('probabilidad') && !validationMessage.includes('bajo'));
  
  // Verificar múltiples formatos de isValid e isLive
  const isValidTrue = isValid === '1' || isValid === 'true' || isValid === true;
  const isLiveTrue = isLive === '1' || isLive === 'true' || isLive === true;
  
  // En el flujo free (sin foto), solo se requiere isValid, no isLive
  const isFreeFlowSuccess = isValidTrue && isLive === undefined;
  const isBiometricFlowSuccess = isValidTrue && isLiveTrue;
  
  console.log('[DEBUG] Análisis de validación:', {
    isValid,
    isLive,
    validationMessage,
    liveProbability,
    hasHighProbability,
    highProbabilityMatch,
    hasHighProbabilityInMessage,
    isSuccessByMessage,
    httpSuccess,
    isValidTrue,
    isLiveTrue,
    isFreeFlowSuccess,
    isBiometricFlowSuccess
  });
  
  if (isFreeFlowSuccess || isBiometricFlowSuccess || isSuccessByMessage) {
            // Extraer información más rica de la respuesta
            const validationMessage = response?.resp?.result || 'Validación exitosa';
            const jsonResult = response?.resp?.jsonResult;
            const userData = jsonResult?.datos || [];
    
    // Construir nombres completos desde los datos del RENIEC
    let fullName = '';
    let dni = '';
    if (userData.length >= 3) {
      dni = userData[1] || '';
      fullName = userData.slice(2).join(' ') || '';
    }
    
    // Usar nombres del API si están disponibles, sino usar los del RENIEC
    const finalNames = response?.names || fullName;
    const finalPaternalSurname = response?.paternal_surname || '';
    const finalMaternalSurname = response?.maternal_surname || '';
    
    return {
      success: true,
      message: '¡Proceso terminado!',
      type: 'success',
      data: {
        names: finalNames,
        paternal_surname: finalPaternalSurname,
        maternal_surname: finalMaternalSurname,
        validity: response?.validity || '',
        file: response?.file || '',
        auth_id: response?.auth_id || '',
        validationMessage: cleanApiMessage(validationMessage),
        documentId: documentId || '',
        dni: dni || dni
      }
    };
  }
  
  // Caso 2: Error en validación facial (isValid = false)
  const isValidFalse = isValid === '0' || isValid === 'false' || isValid === false;
  if (isValidFalse) {
    const rawMessage = response?.resp?.result || response?.resp?.message || 'La identidad no pudo ser validada';
    return {
      success: false,
      message: cleanApiMessage(rawMessage),
      type: 'validation_error'
    };
  }
  
  // Caso 3: Error en detección de vida (isLive = false)
  const isLiveFalse = isLive === '0' || isLive === 'false' || isLive === false;
  if (isLiveFalse) {
    const rawMessage = response?.live?.result || response?.live?.message || 'No se pudo verificar que la imagen corresponda a una persona real';
    return {
      success: false,
      message: cleanApiMessage(rawMessage),
      type: 'liveness_error'
    };
  }
  
  // Caso 4: Error general con mensaje específico
  if (response?.resp?.result || response?.message) {
    const rawMessage = response?.resp?.result || response?.message || 'Error desconocido';
    return {
      success: false,
      message: cleanApiMessage(rawMessage),
      type: 'api_error'
    };
  }
  
  // Caso 5: Respuesta sin información clara
  return {
    success: false,
    message: 'No se pudo procesar la validación correctamente',
    type: 'unknown_error'
  };
};

export default function Page() {
  return (
    <Suspense fallback={<main className='min-h-dvh flex items-center justify-center p-6'><p className='text-gray-300'>Cargando…</p></main>}>
      <ClientContent />
    </Suspense>
  );
}

function ClientContent() {
  const params = useSearchParams();
  const dniId = useId();
  const nombresId = useId();
  const paternoId = useId();
  const maternoId = useId();
  const [step, setStep] = useState<'intro' | 'dni-input' | 'choice' | 'photo' | 'photo-preview' | 'manual-data' | 'signature' | 'result'>('intro');
  const [dni, setDni] = useState<string>('');
  const [choice, setChoice] = useState<'biometric' | 'cedula' | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureVector, setSignatureVector] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [f1, setF1] = useState<string>('');
  const [qrKey, setQrKey] = useState<string>('');
  
  // Estados para versión FREE (datos manuales)
  const [manualNames, setManualNames] = useState<string>(''); // Nombres
  const [manualPaternalSurname, setManualPaternalSurname] = useState<string>(''); // Apellido paterno
  const [manualMaternalSurname, setManualMaternalSurname] = useState<string>(''); // Apellido materno
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [linkValid, setLinkValid] = useState<boolean | null>(null); // null = validando, true = válido, false = inválido
  const [linkValidationError, setLinkValidationError] = useState<string>('');
  
  // Estado para el documento PDF
  const [documentId, setDocumentId] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    detail?: {
      dni?: string;
      choice?: string;
      signatureSent?: boolean;
      key?: string; // QR key para mostrar ID del documento
      names?: string; // Nombre completo
      paternal_surname?: string; // Apellido paterno
      maternal_surname?: string; // Apellido materno
      file?: string; // URL del PDF generado
      isLowQualityPhoto?: boolean; // Para detectar si es error de calidad de foto
      error?: string;
      rawResponse?: string;
      parseError?: string;
      customValidationMessage?: string; // Mensaje personalizado de validación
      customDocumentId?: string; // ID personalizado del documento
    };
  } | null>(null);


  useEffect(() => {
    if (initDone || (address && f1)) return;
    (async () => {
      const idParam = params.get('id') || '';
      const { key: qrKey, thirdValue } = parseQR(idParam); // En flujo 03, el segundo parámetro es 'key', no 'dni'
      setQrKey(qrKey || '');
      
      // Validar acceso al link primero
      // Para código 03: value1=03, value2=KEY (ID del documento), value3=thirdValue (firma/0x1234...)
      if (qrKey && thirdValue) {
        try {
          setLinkValid(null);
          // Para el código 03, usamos el KEY como value2 y thirdValue como value3
          console.log("PARAMS");
          const [_id, _dni, _key] = idParam.split(":");
          console.log(idParam);
          const validationResp = await validateLinkAccess({ 
            code: _id, 
            dni: _dni, 
            key: _key 
          });
          console.log(validationResp?.response?.options)
          const options_ = validationResp?.response?.options;
          const normalizeBits = (bits: string): string => {
          const clean = bits.replace(/[^01]/g, "");
          return (clean + "00000").slice(0, 5);
         };

         const resultado = normalizeBits(options_);
         localStorage.setItem("flags", resultado);

         console.log("RESULT:");
         console.log(result)

          const apiCode = validationResp?.code;
          const isValid = validationResp?.response?.isvalid === true || validationResp?.response?.isValid === true;
          if (apiCode !== 200) {
            setLinkValid(false);
            setLinkValidationError(`Error de validación. Código: ${apiCode}`);
            setInitDone(true);
            return;
          }

          if (!isValid) {
            setLinkValid(false);
            setLinkValidationError('Este enlace no tiene acceso válido o ya ha sido utilizado. Por favor, solicita un nuevo enlace.');
            setInitDone(true);
            return;
          }
          
          setLinkValid(true);
        } catch (e: unknown) {
          console.error('[03] Error validando acceso al link:', e);
          setLinkValid(false);
          setLinkValidationError('Error al validar el acceso. Por favor, verifica que el enlace sea correcto.');
          setInitDone(true);
          return;
        }
      } else {
        // Si no hay KEY o thirdValue, no podemos validar, pero permitimos continuar (para desarrollo)
        console.warn('[03] No se pudo validar el link: faltan KEY o thirdValue');
        setLinkValid(true);
      }
      
      // Extraer el ID del documento desde la URL
      // Formato esperado: https://api.stamping.io/exec/processId/file_O{documentId}.pdf
      const documentIdMatch = idParam.match(/file_O([a-f0-9]+)\.pdf/);
      
      if (documentIdMatch) {
        const docId = documentIdMatch[1];
        setDocumentId(docId);
        
        // Construir URL del documento
        const processId = '8dd04863ee554c056b4b3c76bcea3330227290c5'; // Process ID actual
        const docUrl = `https://api.stamping.io/exec/${processId}/file_O${docId}.pdf`;
        setDocumentUrl(docUrl);
      } else {
        // Intentar extraer solo el ID del hash si no tiene el formato completo
        const hashMatch = idParam.match(/([a-f0-9]{40,})/);
        if (hashMatch) {
          const docId = hashMatch[1];
          setDocumentId(docId);
          
          const processId = '8dd04863ee554c056b4b3c76bcea3330227290c5';
          const docUrl = `https://api.stamping.io/exec/${processId}/file_O${docId}.pdf`;
          setDocumentUrl(docUrl);
        }
      }
      
      const qAddress = params.get('address') || '';
      const qF1 = params.get('f1') || '';
      if (qAddress && !address) setAddress(qAddress);
      if (qF1 && !f1) setF1(qF1);
      
      if (typeof window !== 'undefined') {
        const sa = localStorage.getItem('address') || '';
        const sf = localStorage.getItem('f1') || '';
        if (!qAddress && sa && !address) setAddress(sa);
        if (!qF1 && sf && !f1) setF1(sf);
      }
      
      const base = typeof window !== 'undefined' ? (localStorage.getItem('imei') || crypto.randomUUID()) : 'web-imei';
      const forcedImei = params.get('imei') || '';
      const suggested = qrKey ? `test-imei-${qrKey}` : `test-imei-${base}`;
      const imei = forcedImei || suggested;
      if (typeof window !== 'undefined') localStorage.setItem('imei', imei);
      
      try {
        let resp = await createAddressForWeb(imei);
        let a = resp?.address || resp?.response?.address || '';
        let f = resp?.f1 || resp?.response?.f1 || '';
        
        if (!(a && f)) {
          // Retry una vez con sufijo timestamp como en otros flujos
          const retryImei = `${imei}-${Date.now()}`;
          resp = await createAddressForWeb(retryImei);
          a = resp?.address || resp?.response?.address || '';
          f = resp?.f1 || resp?.response?.f1 || '';
        }
        
        if (a && f) {
          setAddress(a); setF1(f);
          if (typeof window !== 'undefined') {
            localStorage.setItem('address', a);
            localStorage.setItem('f1', f);
          }
        } else {
          // Valores temporales para pruebas mientras se corrige el backend
          const tempAddress = '0x1ea941554fd7344a56a5f94fe4edc056696112d8';
          const tempF1 = 'presente';
          setAddress(tempAddress);
          setF1(tempF1);
        }
      } catch {
        // Error silencioso en createAddressForWeb
      }
      setInitDone(true);
    })();
  }, [initDone, params, address, f1]);


  async function sendSignature() {
    if (!signature || !dni || !choice || !signatureVector) return;
    
    // Para versión FREE, no necesitamos foto
    if (choice === 'biometric' && !photo) return;
    
    setLoading(true);
    const loadingToast = toast.loading('Enviando firma Electrónica...');
    
    try {
      const email = 'web@correogenerado.com';
      
      // Determinar el nombre a enviar según el tipo de validación
      // Para FREE: concatenar nombres + apellido paterno + apellido materno en mayúsculas (como RENIEC)
      const userName = choice === 'biometric' 
        ? 'Usuario' // PREMIUM: Backend obtendrá el nombre real
        : `${manualNames} ${manualPaternalSurname} ${manualMaternalSurname}`.trim().toUpperCase(); // FREE: Concatenado en mayúsculas
      
      // Debug: Verificar datos antes de enviar
      console.log('[DEBUG] Datos a enviar al API:', {
        version: choice === 'biometric' ? 'PREMIUM' : 'FREE',
        hasPhoto: !!photo,
        photoLength: photo?.length || 0,
        hasSignature: !!signature,
        signatureLength: signature?.length || 0,
        hasSignatureVector: !!signatureVector,
        signatureVectorLength: signatureVector?.length || 0,
        signatureIsBase64: signature?.startsWith('data:image/png;base64,'),
        photoIsBase64: photo?.startsWith('data:image/jpeg;base64,'),
        dni: dni,
        userName: userName,
        email: email,
        f1: f1,
        address: address,
        qrKey: qrKey,
        note: choice === 'biometric' ? 'Backend reemplazará "Usuario" con nombre real' : 'Datos manuales del usuario concatenados en mayúsculas'
      });
      
      // Llamar a la API correcta según el tipo de flujo
      console.log('[DEBUG] Enviando datos al API...');
      const resp = choice === 'biometric' 
        ? await notifyEventSignature({
            photo: photo || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', // Foto o placeholder
            email,
            dni,
            f1: f1 || 'f1',
            address: address || 'addr',
            key: qrKey || '',
            signature,
            signaturevector: signatureVector,
            name: userName
          })
        : await notifyEventSignatureFree({
            email,
            dni,
            f1: f1 || 'f1',
            address: address || 'addr',
            key: qrKey || '',
            signature,
            signaturevector: signatureVector,
            name: userName
          });
      
      console.log('[DEBUG] Respuesta del API:', resp);
      toast.dismiss(loadingToast);
      
      // Verificar si hay error de JSON inválido
      if (resp?.error === 'invalid_json') {
        toast.error('Error en la respuesta del servidor (JSON inválido)');
        setResult({ 
          success: false, 
          message: 'Error al procesar la respuesta del servidor. El backend devolvió datos malformados.',
          detail: {
            error: 'invalid_json',
            rawResponse: resp.rawResponse,
            parseError: resp.parseError
          }
        });
        return;
      }
      
      // Determinar el resultado usando la nueva función
      const validationResult = determineValidationResult(resp, documentId);
      
      console.log('[DEBUG] Resultado de validación:', validationResult);
      
      if (validationResult.success) {
        // Éxito: mostrar mensaje de éxito con información rica del usuario
        const successMessage = `${validationResult.message} - Su firma electrónica ha sido procesada exitosamente.`;
        toast.success(successMessage);
        setResult({ 
          success: true, 
          message: successMessage,
          detail: {
            dni: validationResult.data?.dni || dni,
            choice: choice === 'biometric' ? 'Biometría' : 'Cédula de Identidad',
            signatureSent: true,
            key: qrKey, // Agregar el QR key para mostrar el ID del documento
            // Datos del usuario validado
            names: validationResult.data?.names || (choice === 'cedula' ? manualNames : ''),
            paternal_surname: validationResult.data?.paternal_surname || (choice === 'cedula' ? manualPaternalSurname : ''),
            maternal_surname: validationResult.data?.maternal_surname || (choice === 'cedula' ? manualMaternalSurname : ''),
            // Mensaje de validación específico (se pasará como mensaje personalizado)
            customValidationMessage: validationResult.data?.validationMessage || '',
            // ID del documento (se pasará como key personalizado)
            customDocumentId: validationResult.data?.documentId || '',
            // URL del PDF generado
            file: validationResult.data?.file || ''
          }
        });
      } else {
        // Error: mostrar mensaje específico según el tipo de error
        toast.error(validationResult.message);
        setResult({ 
          success: false, 
          message: validationResult.message,
          detail: {
            ...resp?.response,
            errorType: validationResult.type,
            // Incluir información específica del error
            liveness: validationResult.type === 'liveness_error' ? false : undefined,
            isValid: validationResult.type === 'validation_error' ? false : undefined,
            detail: validationResult.message
          }
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error completo en sendSignature:', error);
      console.error('[DEBUG] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      toast.dismiss(loadingToast);
      toast.error('Error al enviar la firma Electrónica');
      setResult({ success: false, message: 'Error al procesar la firma Electrónica' });
    } finally {
      setLoading(false);
      setStep('result');
    }
  }

  // Mostrar error si el link no es válido
  if (linkValid === false) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6 bg-[#f5f5f5]">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso no autorizado</h1>
          <p className="text-gray-600 mb-6">{linkValidationError || 'Este enlace no tiene acceso válido o ya ha sido utilizado.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#187773] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#156663] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  // Mostrar loading mientras se valida el link
  if (linkValid === null) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6 bg-[#f5f5f5]">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 border-4 border-[#187773] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Validando acceso...</h1>
          <p className="text-gray-600">Por favor espera mientras verificamos el enlace.</p>
        </div>
      </main>
    );
  }

  if (step === 'intro') {
    return (
      <div className="min-h-dvh flex flex-col">
        <ThemeToggle />
        
        {/* Contenedor principal scrollable como en el demo */}
        <div className="flex-1 flex flex-col items-center pt-0 pb-4 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <Logo />
            
            <ProgressIndicator currentStep={1} totalSteps={4} />
            
            {/* Título principal */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--text-primary)'}}>
                Revisar documento
              </h1>
            </div>

            {/* Visor de documento si hay URL */}
            {documentUrl && documentId && (
              <DocumentViewer 
                documentUrl={documentUrl} 
              />
            )}
            
            {/* Footer dentro del contenedor scrollable */}
            <footer className="text-center py-6 px-4 mt-8">
              <p className="text-sm" style={{color: 'var(--text-muted)'}}>
                © 2025 <span className="font-semibold" style={{color: '#00c896'}}>Manyao</span>. Todos los derechos reservados.
              </p>
            </footer>
          </div>
        </div>

        {/* Botón fijo en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 p-3 border-t backdrop-blur-xl" style={{backgroundColor: 'var(--button-bg)', borderColor: 'var(--button-border)'}}>
          <div className="max-w-4xl mx-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStep('choice');
              }}
              className="w-full py-3 font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #00c896 0%, #00b4d8 100%)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00c896 0%, #00b4d8 100%)';
              }}
            >
              Empezar ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'dni-input') {
    return (
      <DNIInputScreen
        title=""
        subtitle=""
        description=""
        onDNIEntered={(enteredDni) => {
          console.log('[DEBUG] DNI ingresado:', enteredDni, 'Choice:', choice);
          setDni(enteredDni);
          if (choice === 'biometric') {
            console.log('[DEBUG] Flujo PRO: yendo a captura de foto');
            setStep('photo'); // PRO: Ir a captura de foto
          } else if (choice === 'cedula') {
            console.log('[DEBUG] Flujo FREE: yendo a datos manuales');
            setStep('manual-data'); // FREE: Ir a datos manuales
          }
        }}
        onBack={() => setStep('choice')}
        initialDNI={dni}
      />
    );
  }

  if (step === 'choice') {
    return (
      <ChoiceScreen
        onChoiceSelected={(selectedChoice) => {
          setChoice(selectedChoice);

          if (selectedChoice === 'biometric') {
            // PRO: Ir a captura de DNI primero
            setStep('dni-input');
          } else if (selectedChoice === 'cedula') {
            // FREE: Ir directamente a datos manuales
            setStep('manual-data');
          }
        }}
      />
    );
  }


  if (step === 'photo') {
    console.log('[DEBUG] Mostrando CameraScreen (Paso 3: Captura de foto)');
    return (
      <CameraScreen
        title=""
        subtitle=""
        description=""
        onCapture={(photoData) => {
          setPhoto(photoData);
          setPhotoPreview(photoData);
          setStep('photo-preview');
        }}
        onBack={() => setStep('dni-input')}
      />
    );
  }

  if (step === 'photo-preview') {
    return (
      <CameraPreview
        title=""
        subtitle=""
        imageSrc={photoPreview || ''}
        imageAlt="Foto capturada"
        onRetake={() => setStep('photo')}
        onContinue={() => setStep('signature')}
      />
    );
  }

  if (step === 'manual-data') {
    return (
      <main className='min-h-dvh flex flex-col'>
        <ThemeToggle />
        
        <div className='flex-1 flex flex-col items-center pt-1 pb-4 px-4 overflow-y-auto'>
          {/* Contenedor principal para TODO el contenido */}
          <div className='w-full max-w-lg backdrop-blur-xl border rounded-3xl px-6 py-3 shadow-xl' style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)'}}>
            <Logo />
            
            <ProgressIndicator currentStep={2} totalSteps={4} />

            <div className='mb-8 text-center'>
              <h1 className='text-2xl md:text-3xl font-bold mb-3' style={{color: 'var(--text-primary)'}}>Ingresa tus datos</h1>
              <p className='text-base md:text-lg leading-relaxed' style={{color: 'var(--text-secondary)'}}>Completa tu información para continuar con la firma</p>
            </div>
          
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor={dniId} className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  DNI *
                </label>
                <input
                  id={dniId}
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{
                    borderColor: 'var(--card-border)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>
              
              <div>
                <label htmlFor={nombresId} className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Nombres *
                </label>
                <input
                  id={nombresId}
                  type="text"
                  value={manualNames}
                  onChange={(e) => setManualNames(e.target.value)}
                  placeholder="Tus nombres"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{
                    borderColor: 'var(--card-border)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor={paternoId} className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Apellido Paterno *
                </label>
                <input
                  id={paternoId}
                  type="text"
                  value={manualPaternalSurname}
                  onChange={(e) => setManualPaternalSurname(e.target.value)}
                  placeholder="Apellido paterno"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{
                    borderColor: 'var(--card-border)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor={maternoId} className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                  Apellido Materno *
                </label>
                <input
                  id={maternoId}
                  type="text"
                  value={manualMaternalSurname}
                  onChange={(e) => setManualMaternalSurname(e.target.value)}
                  placeholder="Apellido materno"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{
                    borderColor: 'var(--card-border)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>
            </div>
          
            {/* Mensaje informativo */}
            <div className="mb-6 p-4 rounded-2xl border" style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)'
            }}>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <p className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>
                  Esta información será usada para identificarte en el documento
                </p>
              </div>
            </div>

            {/* Botones verticales */}
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={() => setStep('signature')}
                disabled={!dni.trim() || !manualNames.trim() || !manualPaternalSurname.trim() || !manualMaternalSurname.trim()}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #00c896 0%, #00b4d8 100%)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00c896 0%, #00b4d8 100%)';
                  }
                }}
              >
                Continuar a Firma
              </button>
              
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-300 bg-white"
                style={{
                  borderColor: '#00c896',
                  color: '#00c896'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Volver atrás
              </button>
            </div>

            {/* Footer */}
            <footer className='mt-8 text-center'>
              <p className='text-xs' style={{color: 'var(--text-muted)'}}>
                © 2025 <span style={{color: 'var(--text-primary)'}}>Manyao</span>. Todos los derechos reservados.
              </p>
            </footer>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'signature') {
    return (
      <SignatureScreen
        title=""
        subtitle=""
        description=""
        onSignatureCaptured={(signatureData, vectorData) => {
          console.log('[DEBUG] Firma recibida en el componente padre:', {
            hasSignature: !!signatureData,
            signatureLength: signatureData?.length || 0,
            hasVector: !!vectorData,
            vectorLength: vectorData?.length || 0,
            isSignatureBase64: signatureData?.startsWith('data:image/png;base64,')
          });
          setSignature(signatureData);
          setSignatureVector(vectorData);
        }}
        onContinue={sendSignature}
        onBack={() => setStep(choice === 'biometric' ? 'photo-preview' : 'manual-data')}
        continueDisabled={loading}
        loading={loading}
        method={choice || 'biometric'}
      />
    );
  }

  if (step === 'result') {
    return (
      <ValidationResultCard
        success={result?.success || false}
        message={result?.message || 'Proceso completado.'}
        details={{
          ...result?.detail,
          dni,
          // Asegurar que se use el nombre real de la respuesta, no el genérico
          names: result?.detail?.names || '',
          paternal_surname: result?.detail?.paternal_surname || '',
          maternal_surname: result?.detail?.maternal_surname || ''
        }}
        isLowQualityPhoto={result?.detail?.isLowQualityPhoto || false}
      onRetry={() => {
        setStep('dni-input');
        setResult(null);
        // NO resetear el DNI ni el choice para mantener el contexto
        // setDni(''); // Mantener el DNI ingresado
        // setChoice(null); // Mantener el método de validación
        setPhoto(null);
        setPhotoPreview(null);
        setSignature(null);
        setSignatureVector('');
        setManualNames('');
        setManualPaternalSurname('');
        setManualMaternalSurname('');
      }}
        showRetry={!result?.success}
      />
    );
  }

  return null;
}
