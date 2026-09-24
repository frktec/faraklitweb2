import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductSection } from '@/components/landing/ProductSection';
import { IntegrationsSection } from '@/components/landing/IntegrationsSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { FounderStatement } from '@/components/landing/FounderStatement';
import { PlansSection } from '@/components/landing/PlansSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <main>
        <Hero />
        <ProductSection />
        <IntegrationsSection />
        <SecuritySection />
        <FounderStatement />
        <PlansSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
