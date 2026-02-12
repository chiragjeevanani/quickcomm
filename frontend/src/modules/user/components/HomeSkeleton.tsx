import { Skeleton } from "@/components/ui/skeleton";

export default function HomeSkeleton() {
    return (
        <div className="space-y-8 pb-20">
            {/* Hero Skeleton */}
            <div className="h-[200px] bg-neutral-100 flex flex-col justify-end p-4 md:p-6 lg:p-8 space-y-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-10 w-64 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
                    ))}
                </div>
            </div>

            {/* Search Bar Placeholder */}
            <div className="px-4">
                <Skeleton className="h-12 w-full max-w-xl mx-auto rounded-2xl" />
            </div>

            {/* Promo Section Skeleton */}
            <div className="px-4">
                <div className="flex gap-2">
                    <Skeleton className="w-[100px] h-[120px] rounded-xl flex-shrink-0" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[56px] rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Horizontal Carousel Skeleton */}
            <div className="space-y-4">
                <div className="px-4 flex items-center gap-4">
                    <div className="h-px flex-1 bg-neutral-100" />
                    <Skeleton className="h-8 w-48" />
                    <div className="h-px flex-1 bg-neutral-100" />
                </div>
                <div className="flex gap-4 overflow-hidden px-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="w-[145px] h-[240px] rounded-2xl flex-shrink-0" />
                    ))}
                </div>
            </div>

            {/* Category Grid Skeleton */}
            <div className="px-4 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-square rounded-2xl w-full" />
                            <Skeleton className="h-3 w-3/4 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Cards Skeleton */}
            <div className="px-4 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="w-[85%] md:w-[400px] h-[180px] rounded-2xl flex-shrink-0" />
                    ))}
                </div>
            </div>
        </div>
    );
}
