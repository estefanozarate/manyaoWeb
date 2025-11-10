"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseQR } from '@/lib';
import { createAddressForWeb, validateDNIWithPhoto04 } from '@/lib/api';
import toast from 'react-hot-toast';

// Componentes reutilizables
import IntroScreen from '@/components/IntroScreen';
import CameraScreen from '@/components/CameraScreen';
import CameraPreview from '@/components/CameraPreview';
import ValidationResultCard from '@/components/ValidationResultCard';

function cleanError(raw?: string): string {
  if (!raw) return 'Ocurrió un error en la validación.';
  let t = raw.replace(/^\s*\[[^\]]*\]\s*=>\s*/g, '')
    .replace(/showError\(\d+\s*,\s*/gi, '')
    .replace(/\)\s*params:\s*null\s*$/i, '')
    .replace(/\?/g, 'ó');
  t = t.replace(/Validaci\?n/gi, 'Validación')
       .replace(/identificaci\?n/gi, 'Identificación')
       .replace(/verificaci\?n/gi, 'Verificación');
  return t.trim();
}

function generateDetailedErrorMessage(resp: any): string {
  if (!resp?.response?.json) {
    return 'Error al procesar la validación.';
  }

  const json = resp.response.json;
  const validations = Array.isArray(json.validations) ? json.validations : [];
  const liveness = resp.response.liveness;

  // Verificar validaciones específicas
  const faceCompare = validations.find((v: any) => v.test === 'FACE_COMPARE');
  const faceDetection = validations.find((v: any) => v.test === 'FACE_DETECTION');
  const documentDetection = validations.find((v: any) => v.test === 'DOCUMENT_DETECTION');
  const documentQuality = validations.find((v: any) => v.test === 'DOCUMENT_QUALITY');

  const failedValidations = validations.filter((v: any) => !v.status);
  
  if (failedValidations.length === 0) {
    return 'Validación exitosa';
  }

  // Mensajes específicos basados en qué falló
  const messages: string[] = [];

  if (faceCompare && !faceCompare.status) {
    messages.push('La selfie no coincide con la foto del DNI');
  }

  if (faceDetection && !faceDetection.status) {
    messages.push('No se detectó una cara válida en la selfie');
  }

  if (documentDetection && !documentDetection.status) {
    messages.push('No se detectó un documento válido en la foto del DNI');
  }

  if (documentQuality && !documentQuality.status) {
    messages.push('La foto del DNI no tiene suficiente calidad');
  }

  if (liveness && liveness.status === false) {
    messages.push('La selfie no pasó la verificación de vida (liveness)');
  }

  // Si hay un mensaje de detalle del backend, usarlo
  if (json.detail && typeof json.detail === 'string') {
    const cleanDetail = cleanError(json.detail);
    if (cleanDetail && !messages.includes(cleanDetail)) {
      messages.push(cleanDetail);
    }
  }

  // Si no hay mensajes específicos, usar los resultados de las validaciones
  if (messages.length === 0) {
    const failedTests = failedValidations.map((v: any) => v.test).join(', ');
    messages.push(`Fallaron las siguientes validaciones: ${failedTests}`);
  }

  return messages.join('. ') + '.';
}

export default function Page() {
  return (
    <Suspense fallback={<main className='min-h-dvh flex items-center justify-center p-6'><p className='text-gray-300'>Cargando…</p></main>}>
      <ClientContent />
    </Suspense>
  );
}

function ClientContent() {
  const params = useSearchParams();
  const [step, setStep] = useState<'intro' | 'face' | 'face-preview' | 'dni' | 'dni-preview' | 'result'>('intro');
  const [photoFace, setPhotoFace] = useState<string | null>(null);
  const [photoDNI, setPhotoDNI] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [f1, setF1] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  type Validate04Detail = { response?: { json?: { overallStatus?: boolean; validations?: Array<{ test: string; status: boolean; result: string }> }; liveness?: { status?: boolean } } };
  const [res04, setRes04] = useState<{ success: boolean; message: string; detail?: Validate04Detail } | null>(null);

  useEffect(() => {
    if (initDone || (address && f1)) return;
    (async () => {
      const idParam = params.get('id') || '';
      const { dni } = parseQR(idParam);
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
      const suggested = dni ? `test-imei-${dni}` : `test-imei-${base}`;
      const imei = forcedImei || suggested;
      if (typeof window !== 'undefined') localStorage.setItem('imei', imei);
      try {
        let resp = await createAddressForWeb(imei);
        let a = resp?.address || resp?.response?.address || '';
        let f = resp?.f1 || resp?.response?.f1 || '';
        if (!(a && f)) {
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
        }
      } catch (e) {
        console.log('createAddressForWeb error', e);
      }
      setInitDone(true);
    })();
  }, [initDone, params, address, f1]);

  async function send04() {
    if (!photoFace || !photoDNI) return;
    setLoading(true);
    const loadingToast = toast.loading('Enviando datos para validación...');
    
    try {
      const email = 'web@correogenerado.com';
      const resp: Validate04Detail = await validateDNIWithPhoto04({ photoFace, photoDNI, email, f1: f1 || 'f1', address: address || 'addr' });
      const overall = !!resp?.response?.json?.overallStatus;
      
      toast.dismiss(loadingToast);
      
      const detailedMessage = generateDetailedErrorMessage(resp);
      
      if (overall) {
        toast.success('¡Validación exitosa!');
      } else {
        toast.error(detailedMessage);
      }
      
      setRes04({ 
        success: overall, 
        message: detailedMessage, 
        detail: resp 
      });
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(cleanError(e?.message) || 'Error de red o servidor');
      setRes04({ success: false, message: cleanError(e?.message) || 'Error de red o servidor' });
    } finally {
      setLoading(false);
      setStep('result');
    }
  }

  if (step === 'intro') {
    return (
      <IntroScreen
        title="Validación DNI selfie"
        subtitle="Paso 1: toma una selfie. Paso 2: toma una foto de tu DNI. Luego enviaremos ambas para validar."
        onStart={() => setStep('face')}
        startButtonText="Iniciar"
      />
    );
  }

  if (step === 'face') {
    return (
      <CameraScreen
        title="Validación DNI con selfie"
        subtitle="Paso 1 de 2: Toma una selfie clara"
        description="Después de esta foto, necesitarás tomar una foto de tu DNI"
        onCapture={(data) => { setPhotoFace(data); setStep('face-preview'); }}
        facingMode="user"
        autoCaptureEnabled={true}
        overlay="circle"
        mirror={true}
      />
    );
  }

  if (step === 'face-preview' && photoFace) {
    return (
      <CameraPreview
        title="Validación DNI con selfie"
        subtitle="Paso 1 de 2: Revisa tu selfie"
        imageSrc={photoFace}
        imageAlt="preview-face"
        onRetake={() => { setPhotoFace(null); setStep('face'); }}
        onContinue={() => setStep('dni')}
        continueText="Continuar"
        imageType="selfie"
      />
    );
  }

  if (step === 'dni') {
    return (
      <CameraScreen
        title="Validación DNI con selfie"
        subtitle="Paso 2 de 2: Toma una foto de tu DNI"
        description="Asegúrate de que el DNI esté bien iluminado y se vea claramente"
        onCapture={(data) => { setPhotoDNI(data); setStep('dni-preview'); }}
        facingMode="environment"
        autoCaptureEnabled={false}
        overlay="none"
      />
    );
  }

  if (step === 'dni-preview' && photoDNI) {
    return (
      <CameraPreview
        title="Validación DNI con selfie"
        subtitle="Paso 2 de 2: Revisa la foto de tu DNI"
        imageSrc={photoDNI}
        imageAlt="preview-dni"
        onRetake={() => { setPhotoDNI(null); setStep('dni'); }}
        onContinue={send04}
        continueText="Validar"
        continueDisabled={loading || !address || !f1}
        loading={loading}
        showAddressWarning={!address || !f1}
        imageType="document"
      />
    );
  }

  if (step === 'result') {
    const idParam = params.get('id') || '';
    const { dni } = parseQR(idParam);
    const ok = !!res04?.detail?.response?.json?.overallStatus;
    const detail = (res04?.detail?.response || {}) as NonNullable<Validate04Detail['response']>;
    const json: { overallStatus?: boolean; validations?: Array<{ test: string; status: boolean; result: string }>; detail?: string } = (detail?.json || {}) as any;
    const validations = Array.isArray(json?.validations) ? json.validations : [];

    return (
      <ValidationResultCard
        success={ok}
        message={res04?.message || 'No se pudo validar tu identidad.'}
        details={{
          dni,
          validations,
          liveness: detail.liveness,
          detail: json?.detail
        }}
        onRetry={() => { setStep('face'); setRes04(null); setPhotoFace(null); setPhotoDNI(null); }}
        showRetry={!ok}
      />
    );
  }

  return null;
}
