"use client";

import dynamic from "next/dynamic";

const GlobeIntegration = dynamic(() => import("@/components/Globe/GlobeIntegration"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen bg-black text-white">Loading Globe...</div>,
});

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          Dino Globe
        </h1>
      </div>
      <GlobeIntegration />
    </main>
  );
}
