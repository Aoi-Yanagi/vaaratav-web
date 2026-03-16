// app/(auth)/layout.tsx
import Hero3D from "@/components/3d/HeroGeometric";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      {/* Left Side - 3D Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center bg-neutral-900/50 border-r border-white/10">
        <div className="absolute inset-0 z-0">
          <Hero3D />
        </div>
        <div className="z-10 text-center p-12 backdrop-blur-sm bg-black/20 rounded-3xl border border-white/5">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Secure Connections.
          </h1>
          <p className="text-gray-400 max-w-md">
            Join thousands of users experiencing the next generation of secure, high-fidelity video conferencing.
          </p>
        </div>
      </div>

      {/* Right Side - The Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
        {children}
      </div>
    </div>
  );
}