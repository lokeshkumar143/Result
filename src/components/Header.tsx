import { Bell, Search, Menu, User } from 'lucide-react';
interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onMenuClick, title, subtitle, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden transition-colors">

            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden md:flex items-center relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-64 transition-all" />

          </div>

          <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-200 pl-2 sm:pl-6">
            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Dr. Krithika
                </p>
                <p className="text-xs text-slate-500">Exam Controller</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center border-2 border-white shadow-sm">
                <User className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>);

}