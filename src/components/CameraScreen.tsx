"use client";
import Link from "next/link";
import WebCamera from "./WebCamera";
import Logo from "./Logo";
import ProgressIndicator from "./ProgressIndicator";
import ThemeToggle from "./ThemeToggle";
import { SITE_URL } from "@/lib/env";

interface CameraScreenProps {
  title: string;
  subtitle: string;
  description?: string;
  onCapture: (data: string) => void;
  onBack?: () => void;
  facingMode?: 'user' | 'environment';
  autoCaptureEnabled?: boolean;
  overlay?: 'circle' | 'none';
  mirror?: boolean;
  cancelHref?: string;
  currentStep?: number;
  totalSteps?: number;
}

export default function CameraScreen({
  title,
  subtitle,
  description,
  onCapture,
  onBack,
  facingMode = 'user',
  autoCaptureEnabled = true,
  overlay = 'circle',
  mirror,
  cancelHref = SITE_URL,
  currentStep = 1,
  totalSteps = 2
}: CameraScreenProps) {
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
            {description && (
              <p className='text-sm mt-2' style={{color: 'var(--text-muted)'}}>{description}</p>
            )}
          </div>

          {/* Cámara */}
          <div className='mb-6 flex justify-center'>
            <WebCamera 
              onCapture={onCapture}
              facingMode={facingMode}
              autoCaptureEnabled={autoCaptureEnabled}
              overlay={overlay}
              mirror={mirror}
            />
          </div>

          {/* Botón retroceder */}
          <div className="mb-6">
            {onBack ? (
              <button
                type='button'
                onClick={onBack}
                className='w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-300'
                style={{
                  borderColor: '#00c896',
                  color: '#00c896',
                  backgroundColor: 'var(--card-bg)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }}
              >
                Retroceder
              </button>
            ) : (
              <Link 
                className='w-full py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-300 text-center block'
                style={{
                  borderColor: '#00c896',
                  color: '#00c896',
                  backgroundColor: 'var(--card-bg)'
                }}
                href={cancelHref}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }}
              >
                Retroceder
              </Link>
            )}
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
