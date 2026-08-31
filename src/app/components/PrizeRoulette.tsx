'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { consumeRouletteSpin, grantRouletteSpin, subscribeRouletteSpins } from '../../application/services/rouletteService';

const prizes = [
  { id: 0, label: 'Nada', short: 'Nada', color: '#9333EA', probability: 46, kind: 'lose' as const },
  { id: 1, label: '10% de descuento', short: '🎁 10% Dcto', color: '#1E293B', probability: 2.5, kind: 'discount' as const },
  { id: 2, label: '20% de descuento', short: '🔥 20% Dcto', color: '#6D28D9', probability: 0.7, kind: 'discount' as const },
  { id: 3, label: 'Nada', short: 'Nada', color: '#111827', probability: 46, kind: 'lose' as const },
  { id: 4, label: '25% de descuento', short: '🎉 25% Dcto', color: '#EC4899', probability: 0.3, kind: 'discount' as const },
  { id: 5, label: 'Premio sorpresa', short: '🎁 Sorpresa', color: '#1E293B', probability: 1.5, kind: 'gift' as const },
  { id: 6, label: 'Otro intento', short: '🔄 Otro intento', color: '#3B82F6', probability: 3, kind: 'retry' as const }
];

const totalProbability = prizes.reduce((acc, curr) => acc + curr.probability, 0);
if (totalProbability !== 100) {
  console.error(`ERROR RUTELA: Las probabilidades suman ${totalProbability}, pero deben sumar exactamente 100.`);
}

export default function PrizeRoulette() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof prizes[0] | null>(null);
  const [spinsAvailable, setSpinsAvailable] = useState(0);

  const sliceAngle = 360 / prizes.length;

  useEffect(() => {
    return subscribeRouletteSpins(user?.id, setSpinsAvailable);
  }, [user?.id]);

  const spin = () => {
    if (isSpinning || !user?.id || spinsAvailable <= 0) return;
    setIsSpinning(true);
    setResult(null);

    // Descuenta la oportunidad de inmediato (optimista) y se sincroniza en segundo plano.
    setSpinsAvailable((prev) => Math.max(0, prev - 1));
    consumeRouletteSpin(user.id).catch((err) => console.error('Error consumiendo giro de ruleta:', err));

    // Weighted random selection
    const randomValue = Math.random() * 100;
    let accumulated = 0;
    let prizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      accumulated += prizes[i].probability;
      if (randomValue < accumulated) {
        prizeIndex = i;
        break;
      }
    }

    const extraSpins = 6; 
    
    const sliceCenterAngle = prizeIndex * sliceAngle + sliceAngle / 2;
    const targetRotation = (extraSpins * 360) + (360 - sliceCenterAngle);
    
    const randomOffset = (Math.random() - 0.5) * (sliceAngle - 10);
    const finalRotation = rotation + targetRotation + randomOffset - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(prizes[prizeIndex]);
    }, 6000); 
  };

  const claimPrize = () => {
    if (!result) return;

    if (result.kind === 'retry') {
      // No consume "premio": otorga de inmediato otra oportunidad para volver a girar.
      if (user?.id) grantRouletteSpin(user.id).catch((err) => console.error('Error otorgando giro extra:', err));
      setResult(null);
      return;
    }

    if (result.kind !== 'lose') {
      alert(`¡Has reclamado exitosamente: ${result.label}! Este beneficio se aplicará en tu próxima compra.`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Llamativo Floating Button */}
      <div className="group fixed bottom-24 left-5 lg:bottom-6 lg:left-6 z-[80]">
        <button
          onClick={() => { setResult(null); setIsOpen(true); }}
          className={`relative overflow-hidden rounded-full lg:rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-600 p-[2px] transition-all duration-300 hover:scale-110 lg:hover:scale-105 active:scale-95 ${
            spinsAvailable > 0 ? 'shadow-[0_0_35px_rgba(236,72,153,0.7)]' : 'shadow-[0_0_30px_rgba(139,92,246,0.4)]'
          }`}
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
          <div className="relative bg-[#0B0D14]/90 backdrop-blur-md px-4 py-4 lg:px-6 lg:py-3.5 rounded-full lg:rounded-xl flex items-center justify-center gap-2 h-full">
            <span className="text-2xl lg:text-xl animate-bounce drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🎁</span>
            <span className="hidden lg:inline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 text-sm whitespace-nowrap tracking-wide">
              {spinsAvailable > 0 ? `¡Tienes ${spinsAvailable} ${spinsAvailable === 1 ? 'ticket' : 'tickets'}!` : '¡Prueba tu suerte!'}
            </span>
          </div>
        </button>

        {spinsAvailable > 0 && (
          <span className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75"></span>
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500 border border-white/40 text-[11px] font-black text-white">
              {spinsAvailable}
            </span>
          </span>
        )}

        <span className="pointer-events-none absolute left-full ml-3 hidden translate-x-[-10px] whitespace-nowrap rounded-xl border border-white/10 bg-[#0B0D14]/90 backdrop-blur-md px-3.5 py-2 text-sm font-bold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 max-lg:group-hover:block">
          {spinsAvailable > 0 ? `¡Tienes ${spinsAvailable} ${spinsAvailable === 1 ? 'ticket' : 'tickets'}!` : '¡Prueba tu suerte!'}
        </span>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div 
            className="absolute inset-0 bg-[#0B0D14]/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => !isSpinning && setIsOpen(false)}
          ></div>
          
          {/* Main Modal Container */}
          <div className="relative bg-[#0B0D14] border border-white/10 p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_80px_rgba(124,58,237,0.25)] flex flex-col items-center justify-start w-full max-w-[28rem] lg:max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar mx-auto z-10 animate-in zoom-in-95 duration-300">
            
            {/* Glowing background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] lg:w-full h-[150%] lg:h-full bg-gradient-to-b lg:bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Close Button */}
            <button 
              onClick={() => !isSpinning && setIsOpen(false)}
              className="absolute top-4 right-4 lg:top-6 lg:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 z-20 backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* Header */}
            <div className="w-full text-center mt-2 lg:mt-0 mb-6 lg:mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 mb-3 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] leading-tight">
                🎁 Ruleta de la Suerte
              </h2>
              <p className="text-gray-400 text-sm lg:text-base font-medium max-w-[300px] lg:max-w-md mx-auto leading-relaxed">
                ¡Gira la ruleta y gana premios increíbles para tu próxima compra!
              </p>
            </div>

            {/* Grid Layout (Desktop) / Column (Mobile) */}
            <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
              
              {/* Left Side: Wheel */}
              <div className="relative w-64 h-64 md:w-72 md:h-72 lg:w-96 lg:h-96 flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full rounded-full shadow-[0_0_60px_rgba(139,92,246,0.25)] relative">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="-115 -115 230 230" 
                    className="absolute inset-0"
                  >
                    <defs>
                      <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Rotating Group */}
                    <g 
                      style={{ 
                        transform: `rotate(${rotation - 90}deg)`, 
                        transition: 'transform 6s cubic-bezier(0.15, 0.85, 0.2, 1)' 
                      }}
                    >
                      {/* Slices */}
                      {prizes.map((prize, i) => {
                        const a1 = (i * sliceAngle) * Math.PI / 180;
                        const a2 = ((i + 1) * sliceAngle) * Math.PI / 180;
                        const x1 = Math.cos(a1) * 100;
                        const y1 = Math.sin(a1) * 100;
                        const x2 = Math.cos(a2) * 100;
                        const y2 = Math.sin(a2) * 100;
                        const midAngle = (a1 + a2) / 2;
                        const midAngleDeg = midAngle * 180 / Math.PI;

                        return (
                          <g key={prize.id}>
                            <path 
                              d={`M 0 0 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`} 
                              fill={prize.color} 
                              stroke="#0B0D14" 
                              strokeWidth="2.5" 
                            />
                            <g transform={`rotate(${midAngleDeg}) translate(56, 0)`}>
                              <text 
                                x="0" 
                                y="0" 
                                fill="white" 
                                fontSize="9.5" 
                                fontWeight="800" 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}
                              >
                                {prize.short}
                              </text>
                            </g>
                          </g>
                        )
                      })}

                      {/* Outer decorative ring */}
                      <circle cx="0" cy="0" r="100" fill="none" stroke="#0B0D14" strokeWidth="10" />
                      <circle cx="0" cy="0" r="105" fill="none" stroke="#7C3AED" strokeWidth="2" opacity="0.6" />
                      
                      {/* LEDs */}
                      {Array.from({ length: 21 }).map((_, i) => {
                        const angle = (i * 360 / 21) * Math.PI / 180;
                        return (
                          <circle 
                            key={i} 
                            cx={Math.cos(angle) * 105} 
                            cy={Math.sin(angle) * 105} 
                            r="2.5" 
                            fill={i % 2 === 0 ? "#A855F7" : "#3B82F6"} 
                            filter="url(#glow)"
                          />
                        )
                      })}
                    </g>

                    {/* Static Center Core (No Rotation) */}
                    <g>
                      <circle cx="0" cy="0" r="22" fill="url(#centerGradient)" stroke="#0B0D14" strokeWidth="3" filter="url(#glow)" />
                      <circle cx="0" cy="0" r="17" fill="#13151F" />
                      <text x="0" y="-1" fill="white" fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: '1px' }}>MIRAI</text>
                      <text x="0" y="8" fill="#A855F7" fontSize="7" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: '1px' }}>SHOP</text>
                    </g>

                    {/* Pointer (Static, outside rotating group) */}
                    <g transform="translate(0, -100)">
                      <polygon points="-12,-20 12,-20 0,5" fill="white" filter="url(#glow)" />
                      <polygon points="-8,-16 8,-16 0,2" fill="#F3F4F6" />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Right Side: Actions & Result Area */}
              <div className="flex flex-col items-center justify-center w-full max-w-[280px] lg:max-w-[320px] min-h-[140px] lg:min-h-[300px]">
                
                {!result && !isSpinning && !user && (
                  <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 bg-[#13151F]/40 border border-white/5 p-6 rounded-3xl">
                    <span className="text-4xl mb-3">🔒</span>
                    <p className="text-gray-300 font-bold mb-5 text-sm lg:text-base leading-relaxed">
                      Inicia sesión para acumular oportunidades cada vez que realices una compra.
                    </p>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-3.5 px-8 rounded-xl text-base transition-all w-full hover:scale-105 active:scale-95"
                    >
                      Iniciar sesión
                    </Link>
                  </div>
                )}

                {!result && !isSpinning && user && spinsAvailable <= 0 && (
                  <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 bg-[#13151F]/40 border border-white/5 p-6 rounded-3xl">
                    <span className="text-4xl mb-3">🎟️</span>
                    <p className="text-gray-300 font-bold mb-2 text-sm lg:text-base leading-relaxed">
                      No tienes oportunidades disponibles.
                    </p>
                    <p className="text-gray-500 text-xs lg:text-sm leading-relaxed">
                      Realiza una compra y, una vez que confirmemos tu pedido, recibirás tu ticket para la Ruleta de la Suerte.
                    </p>
                  </div>
                )}

                {!result && user && (isSpinning || spinsAvailable > 0) && (
                  <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <p className="text-gray-300 font-bold mb-4 lg:mb-8 text-center text-sm lg:text-base hidden lg:block">
                      ¡Prueba tu suerte y descubre tu recompensa exclusiva!
                    </p>
                    {!isSpinning && (
                      <span className="mb-4 text-xs font-bold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1.5 rounded-full">
                        {spinsAvailable} {spinsAvailable === 1 ? 'oportunidad disponible' : 'oportunidades disponibles'}
                      </span>
                    )}
                    <button
                      onClick={spin}
                      disabled={isSpinning}
                      className={`relative group overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg lg:text-xl px-10 lg:px-12 py-4 lg:py-5 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300 w-full
                        ${isSpinning ? 'opacity-80 scale-95 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:from-violet-500 hover:to-fuchsia-500'}
                      `}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                      <span className="relative flex items-center justify-center gap-2 drop-shadow-md">
                        {isSpinning ? (
                          <>
                            <span className="animate-spin">✨</span> GIRANDO...
                          </>
                        ) : (
                          '🎁 GIRAR RULETA'
                        )}
                      </span>
                    </button>
                  </div>
                )}

                {result && !isSpinning && (
                  <div className="text-center animate-in zoom-in fade-in duration-500 w-full flex flex-col items-center bg-[#13151F]/40 border border-white/5 p-6 rounded-3xl lg:p-8">
                    <h3 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                      {result.kind === 'lose' ? '¡Casi lo logras!' : '🎉 ¡FELICIDADES! 🎉'}
                    </h3>

                    {result.kind !== 'lose' && (
                      <p className="text-gray-300 text-sm lg:text-base mb-4 uppercase tracking-[0.2em] font-bold">Ganaste</p>
                    )}
                    
                    <div className="relative mb-6 lg:mb-8 w-full">
                      <div className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full"></div>
                      <p className="relative text-xl lg:text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] px-5 py-4 border border-fuchsia-500/30 bg-[#13151F]/80 backdrop-blur-sm rounded-2xl leading-snug">
                        {result.label}
                      </p>
                    </div>
                    
                    {result.kind === 'lose' ? (
                      <button
                        onClick={() => setIsOpen(false)}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-8 rounded-xl text-base lg:text-lg transition-all w-full hover:scale-105 active:scale-95 mb-3"
                      >
                        Cerrar
                      </button>
                    ) : result.kind === 'retry' ? (
                      <button
                        onClick={claimPrize}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-4 px-8 rounded-xl text-base lg:text-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] w-full hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mb-3"
                      >
                        <span className="text-xl">🔄</span> Girar de nuevo
                      </button>
                    ) : (
                      <button
                        onClick={claimPrize}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-4 px-8 rounded-xl text-base lg:text-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] w-full hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mb-3"
                      >
                        <span className="text-xl">🎁</span> Reclamar premio
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
      {/* Scrollbar hides visually in this modal if it's too tall */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </>
  );
}
