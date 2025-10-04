import * as React from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { LikeButton } from "./ui/like-button"
import { extractDiceNotation, extractSaveNotation } from "../utils/spellParsers"

interface Spell {
  name: string
  level: number
  school: string
  time: { number?: number; unit: string }[]
  range: { distance?: { amount?: number; type?: string } }
  components: { v?: boolean; s?: boolean; m?: any }
  duration: { concentration?: boolean; type?: string; duration?: { amount?: number; type?: string } }[]
  entries: any[]
  source: string
  miscTags?: string[]
  areaTags?: string
  entriesHigherLevel?: any[]
}

export interface SpellCardProps {
  spell: Spell
  isLiked: boolean
  onLike: (spell: Spell) => void
  onClick: (spell: Spell) => void
}

export const SpellCard = React.forwardRef<HTMLDivElement, SpellCardProps>(
  ({ spell, isLiked, onLike, onClick }, ref) => {
    return (
      <Card
        ref={ref}
        className="backdrop-blur-xl bg-card/80 border-border/50 shadow-md hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] hover:border-purple-400/30 transition-all duration-300 cursor-pointer relative min-h-[230px] group"
        onClick={() => onClick(spell)}
      >
        <CardContent className="p-6">
          <LikeButton
            isLiked={isLiked}
            onClick={(e) => {
              e.stopPropagation()
              onLike(spell)
            }}
            className="absolute top-5 right-5 z-10"
            animated={isLiked}
          />

          <h2 className="font-cinzel text-xl font-semibold text-foreground mt-2 mb-4 leading-tight group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:bg-clip-text group-hover:text-transparent transition-all max-w-[85%]">
            {spell.name}
          </h2>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Badge className="bg-gradient-to-br from-purple-600 to-purple-400 text-white shadow-lg min-w-8 h-8 px-2.5 text-base font-bold">
                {spell.level}
              </Badge>
              {spell.level === 0 && (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Cantrip
                </span>
              )}
            </div>

            {extractDiceNotation(spell.entries[0]) && (
              <Badge variant="outline" className="bg-red-500/10 border-red-400/30 text-red-400 w-fit">
                {extractDiceNotation(spell.entries[0])}
              </Badge>
            )}

            {extractSaveNotation(spell.entries[0]) && (
              <Badge variant="outline" className="bg-blue-500/15 border-blue-400/30 text-blue-400 w-fit">
                {extractSaveNotation(spell.entries[0])}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
SpellCard.displayName = "SpellCard"
