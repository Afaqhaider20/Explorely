export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pt-[4rem]">
      {children}
    </div>
  );
}
