import * as React from "react"
import { cn } from "../../lib/utils"

export interface StatBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

const StatBadge = React.forwardRef<HTMLDivElement, StatBadgeProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground",
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </div>
    )
  }
)
StatBadge.displayName = "StatBadge"

export { StatBadge }
