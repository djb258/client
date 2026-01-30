/*
 * CTB Metadata
 * ctb_id: CTB-01CAED4FE108
 * ctb_branch: ui
 * ctb_path: ui/components/barton-components/ui/skeleton.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.714801
 * checksum: 0166abaa
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
