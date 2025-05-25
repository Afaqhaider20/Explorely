import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pt-[4rem]">
      <Suspense fallback={<span>Loading...</span>}>
        {children}
      </Suspense>
    </div>
  );
}
