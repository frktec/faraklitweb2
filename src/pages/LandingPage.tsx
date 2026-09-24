import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FaraklitShowcase } from '@/components/landing/FaraklitShowcase';
import { VoiceAssistantSection } from '@/components/landing/VoiceAssistantSection';
import { IntegrationsSection } from '@/components/landing/IntegrationsSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { FounderStatement } from '@/components/landing/FounderStatement';
import { PlansSection } from '@/components/landing/PlansSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main>
        <Hero />
        <VoiceAssistantSection />
        <FaraklitShowcase />
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
