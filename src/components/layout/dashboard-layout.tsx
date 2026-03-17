import Link from 'next/link';
import { LayoutDashboard, Search, Cloud, Mic, Key, CreditCard, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/storage', label: 'Storage', icon: Cloud },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/api-keys', label: 'API Keys', icon: Key },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabaseClient = await createClient() as any;
  const { data: { user } } = await supabaseClient.auth.getUser();

  let profile: { email?: string; full_name?: string; credits_balance?: number; plan?: string } | null = null;
  if (user) {
    const { data } = await supabaseClient
      .from('profiles')
      .select('email, full_name, credits_balance, plan')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r hidden md:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">YYD.AI</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.credits_balance || 0} credits
                </p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post" className="mt-2">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 bg-card border-b md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold text-primary">YYD.AI</Link>
            <details className="relative">
              <summary className="list-none cursor-pointer">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </summary>
              <nav className="absolute right-0 top-full mt-2 w-48 bg-card border rounded-lg shadow-lg p-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-muted"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}