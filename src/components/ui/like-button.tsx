import * as React from "react"
import { AiFillHeart } from 'react-icons/ai';
import { Button } from "./button"
import { cn } from "../../lib/utils"

export interface LikeButtonProps {
  isLiked: boolean
  onClick: (e: React.MouseEvent) => void
  className?: string
  animated?: boolean
}

const LikeButton = React.forwardRef<HTMLButtonElement, LikeButtonProps>(
  ({ isLiked, onClick, className, animated = false }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn("bg-white/10 hover:bg-white/15", className)}
        onClick={onClick}
      >
        {isLiked ? (
          <AiFillHeart
            className={cn(
              "text-red-500 text-xl",
              animated && "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"
            )}
          />
        ) : (
          <AiFillHeart className="text-white/20 text-xl" />
        )}
      </Button>
    )
  }
)
LikeButton.displayName = "LikeButton"

export { LikeButton }
