"use client";

import { ScanFace, ContactRound } from "lucide-react";
import Logo from "./Logo";
import ProgressIndicator from "./ProgressIndicator";
import ThemeToggle from "./ThemeToggle";

interface ChoiceScreenProps {
  onChoiceSelected: (choice: 'biometric' | 'cedula') => void;
  setStep: (step: string) => void; // 👈 agregado

}

export default function ChoiceScreen({ onChoiceSelected }: ChoiceScreenProps) {

  // Leer la variable enviada desde el otro archivo
  const flags = typeof window !== "undefined"
    ? localStorage.getItem("flags") || "000"
    : "000";
  console.log("FLAGSSSSSS");
  console.log(flags)

  return (
    <main className='min-h-dvh flex flex-col'>
      <ThemeToggle />

      <div className='flex-1 flex flex-col items-center pt-0 pb-4 px-4 overflow-y-auto'>
        <div
          className='w-full max-w-lg backdrop-blur-xl border rounded-3xl px-6 py-3 shadow-xl'
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >

          <Logo />
          <ProgressIndicator currentStep={1} totalSteps={4} />

          <div className='mb-8 text-center'>
            <h1 className='text-2xl md:text-3xl font-bold mb-3' style={{ color: 'var(--text-primary)' }}>
              Elige tu método de validación
            </h1>
            <p className='text-base md:text-lg leading-relaxed' style={{ color: 'var(--text-secondary)' }}>
              Selecciona cómo deseas verificar tu identidad de forma segura
            </p>
          </div>

          <div className='space-y-4 mb-6'>

            {flags[0] === "1" && (
              <button onClick={() => onChoiceSelected('cedula')} className='w-full p-4 border-2 border-[#187773] rounded-lg hover:bg-[#187773] hover:text-white transition-colors group bg-white relative'>
                <div className='absolute -top-2 -right-2'>
                  <span className='bg-gradient-to-r from-green-400 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg'>
                    🆓 FREE
                  </span>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='p-3 bg-[#187773] rounded-full group-hover:bg-white transition-colors'>
                    <ContactRound size={24} className='text-white group-hover:text-[#187773]' />
                  </div>
                  <div className='text-left'>
                    <h3 className='font-bold text-lg text-[#187773] group-hover:text-white transition-colors'>
                      Validación Simple
                    </h3>
                    <p className='text-sm text-gray-600 group-hover:text-white transition-colors'>
                      No se verificará la identidad de la persona
                    </p>
                  </div>
                </div>
              </button>
            )}

            {flags[1] === "1" && (
              <button 
              onClick={() => onChoiceSelected('biometric')} 
              className='w-full p-4 border-2 border-[#187773] rounded-lg hover:bg-[#187773] hover:text-white transition-colors group bg-white relative'>
                <div className='absolute -top-2 -right-2'>
                  <span className='bg-gradient-to-r from-blue-400 to-blue-600 text-blue-900 px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                    🔥 PRO
                  </span>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='p-3 bg-[#187773] rounded-full group-hover:bg-white transition-colors'>
                    <ScanFace size={24} className='text-white group-hover:text-[#187773]' />
                  </div>

                  <div className='text-left'>
                    <h3 className='font-bold text-lg text-[#187773] group-hover:text-white transition-colors'>
                      Validación con RENIEC
                    </h3>
                    <p className='text-sm text-gray-600 group-hover:text-white transition-colors'>
                      Verificación oficial con registro nacional
                    </p>
                  </div>
                </div>
              </button>
            )}

            {flags[2] === "1" && (
              <button
              className='w-full p-4 border-2 border-[#187773] rounded-lg hover:bg-[#187773] hover:text-white transition-colors group bg-white relative'>
                <div className='absolute -top-2 -right-2'>
                  <span className='bg-gradient-to-r from-blue-400 to-blue-600 text-blue-900 px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                    🔥 PRO
                  </span>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='p-3 bg-[#187773] rounded-full group-hover:bg-white transition-colors'>
                    <ContactRound size={24} className='text-white group-hover:text-[#187773]' />
                  </div>

                  <div className='text-left'>
                    <h3 className='font-bold text-lg text-[#187773] group-hover:text-white transition-colors'>
                      Validación con DNI
                    </h3>
                    <p className='text-sm text-gray-600 group-hover:text-white transition-colors'>
                      Su rostro será comparado con el de su DNI.
                    </p>
                  </div>
                </div>
              </button>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}

            {/* Opción 4: eDNI - PREMIUM (disabled) */}
{/*            
            <button
              type='button'
              disabled
              className='w-full p-4 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed opacity-60 relative'
            >
              <div className='absolute -top-2 -right-2'>
                <span className='bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                  ⭐ PREMIUM
                </span>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='p-3 bg-gray-300 rounded-full'>
                  <IdCard size={24} className='text-gray-500' />
                </div>

                <div className='text-left'>
                  <h3 className='font-bold text-lg text-gray-500'>
                    Validación con eDNI
                  </h3>
                  <p className='text-sm text-gray-400'>
                    Se valida usando su DNI electrónico tipo 2 o 3.
                  </p>
                </div>
              </div>
            </button>
*/}
            {/* Opción 5: NFC - PREMIUM (disabled) */}

{/*
            <button
              type='button'
              disabled
              className='w-full p-4 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed opacity-60 relative'
            >
              <div className='absolute -top-2 -right-2'>
                <span className='bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-md'>
                  ⭐ PREMIUM
                </span>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='p-3 bg-gray-300 rounded-full'>
                  <SmartphoneNfc size={24} className='text-gray-500' />
                </div>

                <div className='text-left'>
                  <h3 className='font-bold text-lg text-gray-500'>
                    Validación con NFC
                  </h3>
                  <p className='text-sm text-gray-400'>
                    Se valida usando su tarjeta criptocard usando NFC.
                  </p>
                </div>
              </div>
            </button>
*/}