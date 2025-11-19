"use client";
import { useState, useId } from "react";
import Logo from "./Logo";
import ProgressIndicator from "./ProgressIndicator";
import ThemeToggle from "./ThemeToggle";

interface DNIInputScreenProps {
  title: string;
  subtitle: string;
  description?: string;
  onDNIEntered: (dni: string) => void;
  onBack?: () => void;
  initialDNI?: string;
  cancelHref?: string;
}

export default function DNIInputScreen({
  onDNIEntered,
  onBack,
  initialDNI = "",
}: DNIInputScreenProps) {
  const [dni, setDni] = useState(initialDNI);
  const [error, setError] = useState("");
  const inputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar DNI peruano (8 dígitos)
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
      setError("El DNI debe tener 8 dígitos");
      return;
    }
    
    setError("");
    onDNIEntered(dni);
  };

  const handleDNIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 8) {
      setDni(value);
      if (error) setError("");
    }
  };

  return (
    <main className='min-h-dvh flex flex-col'>
      <ThemeToggle />
      
      <div className='flex-1 flex flex-col items-center pt-0 pb-4 px-4 overflow-y-auto'>
        {/* Contenedor principal para TODO el contenido */}
        <div className='w-full max-w-lg backdrop-blur-xl border rounded-3xl px-6 py-3 shadow-xl' style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)'}}>
          <Logo />
          
          <ProgressIndicator currentStep={2} totalSteps={4} />
        
          <div className='mb-8 text-center'>
            <h1 className='text-2xl md:text-3xl font-bold mb-3' style={{color: 'var(--text-primary)'}}>Ingresa tu DNI</h1>
            <p className='text-base md:text-lg leading-relaxed' style={{color: 'var(--text-secondary)'}}>Validaremos tu identidad con el registro oficial de RENIEC</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6 mb-6'>
            <div>
              <label htmlFor={inputId} className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
                Número de Documento
              </label>
              <input
                type="text"
                id={inputId}
                value={dni}
                onChange={handleDNIChange}
                placeholder="Ingresa 8 dígitos"
                className={`w-full px-4 py-3 border rounded-lg text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors ${
                  error ? 'border-red-500 focus:border-red-500' : 'border-[#187773] focus:border-[#165956]'
                }`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
                maxLength={8}
                autoComplete="off"
                required
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
          </form>

          {/* Botones verticales */}
          <div className="space-y-4 mb-6">
            <button
              type='button'
              onClick={handleSubmit}
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
              disabled={dni.length !== 8}
            >
              Validar Identidad
            </button>
            
            {onBack && (
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
                Volver atrás
              </button>
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
