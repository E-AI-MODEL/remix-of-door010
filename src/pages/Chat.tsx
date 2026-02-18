import { useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

declare global {
  interface Window {
    cmwc: {
      add: (id: string) => { install: () => void };
    };
  }
}

export default function Chat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.src = "https://webchat.digitalcx.com/inline.js";
    script.type = "module";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.cmwc) {
        window.cmwc.add("b27c3288-ffe3-4717-9b75-23bc222a2cc1").install();
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      try { document.body.removeChild(script); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4">
            Chat met onze <span className="text-primary">AI-assistent</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Stel je vragen over het onderwijs in Rotterdam. Deze chatbot wordt aangedreven door het{" "}
            <a
              href="https://www.cm.com/nl-nl/platform/conversational-ai-cloud/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Halo Platform van cm.com
            </a>.
          </p>
        </div>
        <div ref={containerRef} id="cm-webchat-container" className="min-h-[500px]" />
      </main>
      <Footer />
    </div>
  );
}
