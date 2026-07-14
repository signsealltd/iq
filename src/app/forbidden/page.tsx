export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud p-6">
      <div className="panel max-w-md p-6">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-steel">Your role does not have permission to use this area.</p>
      </div>
    </main>
  );
}
