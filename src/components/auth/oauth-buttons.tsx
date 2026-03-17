'use client';

import { Button } from '@/components/ui/button';
import { Github, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toaster';

export function OAuthButtons() {
  const { toast } = useToast();

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate OAuth login',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        type="button"
        onClick={() => handleOAuthLogin('google')}
      >
        <Mail className="mr-2 h-4 w-4" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={() => handleOAuthLogin('github')}
      >
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </div>
  );
}