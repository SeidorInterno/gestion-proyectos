import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 border-b p-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px] mb-2" />
        <Skeleton className="h-3 w-[80px]" />
      </CardContent>
    </Card>
  );
}

// Stats cards skeleton
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Client card skeleton
export function ClientCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-[100px] mt-1" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-5 w-[80px]" />
          <Skeleton className="h-5 w-[60px]" />
        </div>
      </CardContent>
    </Card>
  );
}

// Clients grid skeleton
export function ClientsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ClientCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Project card skeleton
export function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <Skeleton className="h-6 w-[80px] rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-[60px]" />
            <Skeleton className="h-3 w-[30px]" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Projects grid skeleton
export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Gantt chart skeleton
export function GanttSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b pb-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 flex-1" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-6 flex-1" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center gap-4 pl-8">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsCardsSkeleton />
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-[80px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  );
}

// Calendar skeleton
export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
