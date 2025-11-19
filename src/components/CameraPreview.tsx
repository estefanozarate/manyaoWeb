"use client";
import { Camera } from "lucide-react";
import Logo from "./Logo";
import ProgressIndicator from "./ProgressIndicator";
import ThemeToggle from "./ThemeToggle";

interface CameraPreviewProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  onRetake: () => void;
  onContinue: () => void;
  continueText?: string;
  continueDisabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  showAddressWarning?: boolean;
  imageType?: 'selfie' | 'document'; // Para ajustar las dimensiones según el tipo
  currentStep?: number;
  totalSteps?: number;
}

export default function CameraPreview({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  onRetake,
  onContinue,
  continueText = "Continuar",
  continueDisabled = false,
  loading = false,
  loadingText = "Enviando…",
  showAddressWarning = false,
  imageType = 'selfie',
  currentStep = 1,
  totalSteps = 2
}: CameraPreviewProps) {
  return (
    <main className='min-h-dvh flex flex-col'>
      <ThemeToggle />
      
      <div className='flex-1 flex flex-col items-center pt-0 pb-4 px-4 overflow-y-auto'>
        {/* Contenedor principal para TODO el contenido */}
        <div className='w-full max-w-lg backdrop-blur-xl border rounded-3xl px-6 py-3 shadow-xl' style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)'}}>
          <Logo />
          
          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          

          <div className='mb-8 text-center'>
            <h1 className='text-2xl md:text-3xl font-bold mb-3' style={{color: 'var(--text-primary)'}}>{title}</h1>
            <p className='text-base md:text-lg leading-relaxed' style={{color: 'var(--text-secondary)'}}>{subtitle}</p>
          </div>

          {/* Imagen de preview */}
          <div className='mb-6 flex justify-center'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageSrc} 
              alt={imageAlt} 
              className={`rounded-2xl border-2 shadow-lg ${
                imageType === 'document' 
                  ? 'w-[280px] h-[200px] object-contain' // Para DNI: más ancho, menos alto, mantener proporción
                  : 'w-[240px] h-[320px] object-cover'   // Para selfie: proporción vertical
              }`}
              style={{
                borderColor: 'var(--card-border)'
              }}
            />
          </div>

          {showAddressWarning && (
            <div className='mb-6 p-4 rounded-2xl border' style={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              borderColor: 'rgba(244, 67, 54, 0.3)'
            }}>
              <p className='text-sm text-center font-medium' style={{color: '#f44336'}}>
                Inicializando datos (address/f1)… Si persiste, recarga o vuelve a intentar.
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-4 mb-6">
            <button
              type='button'
              onClick={onContinue}
              disabled={continueDisabled || loading}
              className='w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
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
              {loading ? loadingText : continueText}
            </button>
            
            <button
              type='button'
              onClick={onRetake}
              className='w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2'
              style={{
                borderColor: '#ef4444',
                color: '#ef4444',
                backgroundColor: 'var(--card-bg)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }}
            >
              <Camera size={20} />
              Repetir
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
