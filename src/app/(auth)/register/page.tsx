import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-primary">YYD.AI</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-muted-foreground">
            Get started with 100 free credits
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}