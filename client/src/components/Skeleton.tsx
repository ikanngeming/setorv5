export default function Skeleton() {
  return (
    <div className="flex h-screen w-full animate-pulse">
      {/* Sidebar */}
      <div className="w-64 bg-muted/40 border-r flex flex-col gap-4 p-4">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="flex flex-col gap-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-muted rounded-lg" />
          ))}
        </div>
        <div className="mt-auto h-12 w-full bg-muted rounded-lg" />
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b bg-muted/30" />
        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
