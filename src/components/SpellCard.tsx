import * as React from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { LikeButton } from "./ui/like-button"
import { extractDiceNotation, extractSaveNotation } from "../utils/spellParsers"

const SCHOOL_COLORS: Record<string, { from: string; to: string; text: string; glow: string }> = {
  'Abjuration': { from: 'from-blue-500', to: 'to-cyan-400', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
  'Conjuration': { from: 'from-yellow-500', to: 'to-amber-400', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' },
  'Divination': { from: 'from-purple-400', to: 'to-pink-400', text: 'text-purple-400', glow: 'shadow-purple-500/50' },
  'Enchantment': { from: 'from-pink-500', to: 'to-rose-400', text: 'text-pink-400', glow: 'shadow-pink-500/50' },
  'Evocation': { from: 'from-red-500', to: 'to-orange-400', text: 'text-red-400', glow: 'shadow-red-500/50' },
  'Illusion': { from: 'from-indigo-500', to: 'to-purple-400', text: 'text-indigo-400', glow: 'shadow-indigo-500/50' },
  'Necromancy': { from: 'from-green-600', to: 'to-emerald-500', text: 'text-green-400', glow: 'shadow-green-500/50' },
  'Transmutation': { from: 'from-teal-500', to: 'to-cyan-400', text: 'text-teal-400', glow: 'shadow-teal-500/50' },
}

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
    const schoolColor = SCHOOL_COLORS[spell.school] || SCHOOL_COLORS['Evocation']

    return (
      <Card
        ref={ref}
        className={`backdrop-blur-xl bg-card/80 border-border/50 shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.6)] hover:-translate-y-3 hover:scale-[1.03] transition-all duration-500 cursor-pointer relative min-h-[240px] group rounded-2xl overflow-hidden`}
        onClick={() => onClick(spell)}
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${schoolColor.from} ${schoolColor.to} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
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

          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`${schoolColor.text} border-${schoolColor.text}/30 bg-${schoolColor.text}/5 text-xs font-semibold px-2 py-0.5`}>
              {spell.school}
            </Badge>
          </div>

          <h2 className={`font-cinzel text-xl font-semibold mb-4 leading-tight max-w-[85%] bg-gradient-to-r ${schoolColor.from} ${schoolColor.to} bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:opacity-90 transition-all duration-300`}>
            {spell.name}
          </h2>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Badge className={`bg-gradient-to-br ${schoolColor.from} ${schoolColor.to} text-white shadow-lg min-w-8 h-8 px-2.5 text-base font-bold rounded-lg`}>
                {spell.level}
              </Badge>
              {spell.level === 0 && (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
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
