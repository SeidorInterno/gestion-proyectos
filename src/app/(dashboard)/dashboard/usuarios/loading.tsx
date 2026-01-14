import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsuariosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <Skeleton className="h-10 w-[160px]" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-[180px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-10 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex gap-4 border-b pb-3">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[40px]" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-6 w-[100px] rounded-full" />
                <Skeleton className="h-6 w-[60px] rounded-full" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
