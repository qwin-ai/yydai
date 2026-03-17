import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Cloud, Mic, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

const quickActions = [
  {
    title: 'Web Search',
    description: 'Search the web with AI-powered results',
    icon: Search,
    href: '/search',
    color: 'text-blue-500',
  },
  {
    title: 'Cloud Storage',
    description: 'Upload and manage your files',
    icon: Cloud,
    href: '/storage',
    color: 'text-green-500',
  },
  {
    title: 'Voice Services',
    description: 'Clone voices or synthesize speech',
    icon: Mic,
    href: '/voice',
    color: 'text-purple-500',
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null };

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id')
    .eq('user_id', user.id);

  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5) as { data: Transaction[] | null };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'User'}</h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your account and usage
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credits Balance</CardDescription>
            <CardTitle className="text-3xl">{profile?.credits_balance || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <a href="/billing">Buy Credits</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-3xl capitalize">{profile?.plan || 'Free'}</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.plan === 'free' && (
              <Button variant="outline" size="sm" asChild>
                <a href="/billing">Upgrade to Pro</a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Keys</CardDescription>
            <CardTitle className="text-3xl">{apiKeys?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <a href="/api-keys">Manage Keys</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <a href={action.href}>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions && recentTransactions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{tx.description || tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}