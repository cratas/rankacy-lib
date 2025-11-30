"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Loader2 } from "lucide-react";

// Spinner loading indicator
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <Loader2 className={`animate-spin ${spinnerSizes[size]} ${className}`} />
  );
}

// Full page loading state
export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Book card skeleton for loading state - mobile optimized
export function BookCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-40 sm:h-48 w-full" />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="p-3 sm:p-4 pt-0">
        <Skeleton className="h-9 sm:h-10 w-full" />
      </div>
    </div>
  );
}

// Grid of book card skeletons
interface BookGridSkeletonProps {
  count?: number;
}

export function BookGridSkeleton({ count = 6 }: BookGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Book detail skeleton - mobile optimized
export function BookDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Skeleton className="h-8 w-32 mb-6 sm:mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="max-w-[280px] sm:max-w-sm mx-auto lg:mx-0 w-full">
            <Skeleton className="aspect-2/3 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Skeleton className="h-8 sm:h-10 w-3/4" />
            <Skeleton className="h-5 sm:h-6 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 sm:w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// My books skeleton - mobile optimized
export function MyBooksCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-28 sm:h-32 w-full" />
      <div className="p-3 sm:p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

// Rental item skeleton - mobile optimized
export function RentalItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <Skeleton className="w-14 h-20 sm:w-16 sm:h-24 rounded shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-fit">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm sm:text-base">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
