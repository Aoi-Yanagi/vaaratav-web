export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-black">
      {/* This magic {children} prop is what actually renders your login/signup pages! */}
      {children} 
    </div>
  );
}