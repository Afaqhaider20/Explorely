import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      {/* Title */}
      <div className="px-6 pt-2">
        <Skeleton className="h-5 w-2/3 mb-2" />
      </div>
      {/* Content */}
      <div className="px-6 pb-2">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6 mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Media */}
      <div className="w-full aspect-video bg-muted">
        <Skeleton className="w-full h-full" />
      </div>
      {/* Footer */}
      <div className="flex items-center gap-6 px-6 py-4 border-t">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
} 