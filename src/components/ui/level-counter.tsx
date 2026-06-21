import * as React from "react"
import { cn } from "../../lib/utils"

export interface LevelCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  level: number
  count: number
  maxCount: number
}

const LevelCounter = React.forwardRef<HTMLDivElement, LevelCounterProps>(
  ({ className, level, count, maxCount, ...props }, ref) => {
    const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center gap-1 rounded-md border border-border bg-card p-1.5",
          className
        )}
        {...props}
      >
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
          Lvl {level}
        </span>
        <div className="relative h-7 w-full overflow-hidden rounded bg-secondary">
          <div
            className="absolute bottom-0 left-0 right-0 rounded bg-[color-mix(in_srgb,hsl(var(--accent-strong))_55%,transparent)]"
            style={{ height: `${barHeight}%` }}
          />
          <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-xs font-bold tabular-nums text-foreground">
            {count}
          </span>
        </div>
      </div>
    )
  }
)
LevelCounter.displayName = "LevelCounter"

export { LevelCounter }
