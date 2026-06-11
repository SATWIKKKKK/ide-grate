'use client';

import { Code2, Github, ArrowRight } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function FinalCTA() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignIn = async (provider) => {
    if (session) {
      router.push('/dashboard');
      return;
    }
    await signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <section className="border-t border-border bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="signal-container text-center" data-gsap="fade-up">
        <p className="signal-kicker justify-center">
          <Code2 className="size-4 text-primary" />
          editor truth
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl sm:text-5xl">
          Your coding graph should come from actual coding.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Connect the extension, code normally, and let your dashboard build from real heartbeats.
        </p>
        <div className="mt-8 flex justify-center">
          <button onClick={() => handleSignIn('github')} className="signal-button">
            <Github className="size-5" />
            Continue with GitHub
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

