import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarioLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <Skeleton className="h-10 w-[160px]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar skeleton */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-[150px]" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holidays list skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
