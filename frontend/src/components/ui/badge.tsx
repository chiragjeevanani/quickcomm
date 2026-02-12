import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        user: "border-transparent bg-[hsl(var(--user-accent))] text-white hover:bg-[hsl(var(--user-accent))]/80",
        admin: "border-transparent bg-[hsl(var(--admin-accent))] text-white hover:bg-[hsl(var(--admin-accent))]/80",
        seller: "border-transparent bg-[hsl(var(--seller-accent))] text-white hover:bg-[hsl(var(--seller-accent))]/80",
        delivery: "border-transparent bg-[hsl(var(--delivery-accent))] text-white hover:bg-[hsl(var(--delivery-accent))]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
