// This layout has been simplified to its most basic form.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {children}
    </main>
  );
}
