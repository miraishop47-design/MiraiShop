const BENEFITS = [
  {
    id: 1,
    title: 'Diseños Exclusivos',
    desc: 'Piezas únicas diseñadas internamente con atención meticulosa a cada detalle y curva.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    )
  },
  {
    id: 2,
    title: 'Hecho Bajo Pedido',
    desc: 'Fabricamos tu producto al instante. Sin inventarios masivos, solo producción enfocada en tu pieza.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    )
  },
  {
    id: 3,
    title: 'Calidad Premium',
    desc: 'Utilizamos los mejores materiales del mercado para asegurar durabilidad y acabados perfectos.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
    )
  },
  {
    id: 4,
    title: 'Envíos Nacionales',
    desc: 'Tu setup ideal llega directo a la puerta de tu casa, estés donde estés, con empaques seguros.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
    )
  }
];

export default function WhyMiraiShop() {
  return (
    <div className="py-12 md:py-24">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
          Más que una tienda, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]">un estilo de vida.</span>
        </h2>
        <p className="text-lg text-gray-400 font-light leading-relaxed">
          Diseñamos productos pensando en la estética moderna, la organización extrema y el amor por la tecnología. Cada pieza tiene un propósito en tu espacio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BENEFITS.map((benefit) => (
          <div 
            key={benefit.id}
            className="group relative bg-[#13151F] border border-white/5 rounded-3xl p-8 hover:bg-[#1A1D27] transition-colors duration-500 overflow-hidden"
          >
            {/* Soft Glow on hover */}
            <div className="absolute -inset-10 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="text-[#8B5CF6] mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
              {benefit.icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
              {benefit.title}
            </h3>
            
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              {benefit.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
