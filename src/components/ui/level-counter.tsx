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
          "flex flex-col items-center gap-1 p-1.5 bg-white/5 rounded-md hover:bg-cyan-500/15 transition-all",
          className
        )}
        {...props}
      >
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
          Lvl {level}
        </span>
        <div className="w-full h-7 bg-white/5 rounded relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-400 rounded transition-all duration-500"
            style={{ height: `${barHeight}%` }}
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white z-10 drop-shadow">
            {count}
          </span>
        </div>
      </div>
    )
  }
)
LevelCounter.displayName = "LevelCounter"

export { LevelCounter }
