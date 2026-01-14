import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function KanbanColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function EventosLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumnSkeleton />
        <KanbanColumnSkeleton />
        <KanbanColumnSkeleton />
        <KanbanColumnSkeleton />
      </div>
    </div>
  );
}
