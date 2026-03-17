import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Cloud, Mic, Wrench } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Web Search',
    description: 'Intelligent web search powered by AI, delivering accurate and relevant results in real-time.',
    href: '/search',
  },
  {
    icon: Cloud,
    title: 'Cloud Storage',
    description: 'Secure and scalable cloud storage with global CDN for fast access anywhere.',
    href: '/storage',
  },
  {
    icon: Mic,
    title: 'Voice Cloning',
    description: 'Clone any voice with just a few seconds of audio. Create custom voices for your projects.',
    href: '/voice',
  },
  {
    icon: Wrench,
    title: 'Voice Design',
    description: 'Design and synthesize natural-sounding speech with advanced TTS technology.',
    href: '/voice',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">YYD.AI</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            AI Agent Skills
            <span className="block text-primary">At Your Fingertips</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Powerful APIs for web search, cloud storage, voice cloning, and voice design.
            Build intelligent applications with enterprise-grade reliability.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Building Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Four powerful services, one unified platform. Pay only for what you use.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-lg opacity-90">
            Sign up now and get 100 free credits to explore all features.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">YYD.AI</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/docs" className="hover:text-foreground">Documentation</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} YYD.AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}