export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">{children}</div>;
}
