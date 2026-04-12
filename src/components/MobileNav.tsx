import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Serviços', url: '/servicos', icon: FileText },
  { title: 'Receber', url: '/recebimentos', icon: Receipt },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Config', url: '/configuracoes', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url ||
            (item.url !== '/' && location.pathname.startsWith(item.url));
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                isActive && "font-bold"
              )}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
