import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductSection } from '@/components/landing/ProductSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { IntegrationsSection } from '@/components/landing/IntegrationsSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { FounderStatement } from '@/components/landing/FounderStatement';
import { PlansSection } from '@/components/landing/PlansSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { LiveWallpaper } from '@/components/landing/LiveWallpaper';

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen">
      <LiveWallpaper />
      <Navbar />
      <main>
        <Hero />
        <ProductSection />
        <ComparisonSection />
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
