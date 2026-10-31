import { useEffect } from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureSections } from '@/components/landing/FeatureSections';
import { HowItWorks, Benefits } from '@/components/landing/HowItWorksAndBenefits';
import { LandingFooter } from '@/components/landing/LandingFooter';

export function LandingPage() {
  useEffect(() => {
    document.title = 'CampusConnect | Making Campus Life Smarter, Together';
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-navy-900">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeatureSections />
        <HowItWorks />
        <Benefits />
      </main>
      <LandingFooter />
    </div>
  );
}
