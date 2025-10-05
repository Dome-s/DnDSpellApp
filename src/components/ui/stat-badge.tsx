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
          "flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors duration-200 text-foreground",
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
