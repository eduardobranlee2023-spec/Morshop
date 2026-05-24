import { Outlet, Link } from 'react-router-dom';


export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link to="/" className="flex items-center">
            <img src="/logo-solo.png" alt="Morshop" className="h-[28px] w-auto object-contain" />
          </Link>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <img src="/logo-letras.png" alt="Morshop" className="h-[20px] w-auto object-contain opacity-90" />
          </div>

          <nav>
            <Link to="/login" className="text-sm font-bold bg-[#2563eb] text-white px-5 py-2.5 rounded-full hover:bg-[#1d4ed8] transition-colors shadow-sm hover:shadow">
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 text-center text-sm text-neutral-500 bg-white">
        © {new Date().getFullYear()} Morshop. Tu tienda online gratuita.
      </footer>
    </div>
  );
}
