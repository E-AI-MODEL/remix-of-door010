import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { JourneySection } from "@/components/home/JourneySection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ExternalLink } from "lucide-react";

function TestBanner() {
  return (
    <div className="w-full bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-semibold">
      ⚠️ Dit is een testpagina van het{" "}
      <a
        href="https://www.cm.com/nl-nl/platform/conversational-ai-cloud/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline inline-flex items-center gap-1 hover:text-amber-800"
      >
        Halo Platform van cm.com
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TestBanner />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <JourneySection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
