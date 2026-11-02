export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 md:px-12">
        <div className="inline-flex w-fit items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-300">
          AI Task Manager
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Smart task planning for teams and individuals.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 md:text-xl">
            This app is ready for production deployment with Next.js, Prisma, and
            environment-based configuration for database and AI services.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "Production-ready Next.js setup",
            "Prisma database integration",
            "Environment-based deployment config",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/20"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
