import Link from 'next/link';

const CATEGORIES = [
  {
    id: 'gaming',
    name: 'Gaming',
    desc: 'Eleva tu nivel de juego',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-2 lg:col-span-2'
  },
  {
    id: 'hogar',
    name: 'Hogar',
    desc: 'Espacios que inspiran',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-1 lg:col-span-1'
  },
  {
    id: 'oficina',
    name: 'Oficina',
    desc: 'Productividad y confort',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-1 lg:col-span-1'
  },
  {
    id: 'decoracion',
    name: 'Decoración',
    desc: 'Detalles que importan',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-2 lg:col-span-1'
  },
  {
    id: 'accesorios',
    name: 'Accesorios',
    desc: 'Impresos con precisión 3D',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-3 lg:col-span-1'
  }
];

export default function PremiumCategories() {
  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Colecciones</h2>
          <p className="text-gray-400 font-light text-lg">Encuentra el diseño perfecto para tu estilo de vida.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
        {CATEGORIES.map((cat) => (
          <Link 
            key={cat.id} 
            href={`/productos?category=${cat.name}`}
            className={`relative rounded-3xl overflow-hidden group shadow-xl bg-[#13151F] border border-white/5 block ${cat.colSpan}`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D14]/90 via-[#0B0D14]/30 to-transparent transition-opacity duration-300" />
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_100%)] pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-1 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-lg">
                {cat.name}
              </h3>
              <p className="text-sm md:text-base text-gray-300 font-medium group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                {cat.desc}
              </p>
              
              {/* Arrow Indicator */}
              <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
