import * as React from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { LikeButton } from "./ui/like-button"
import { extractDiceNotation, extractSaveNotation } from "../utils/spellParsers"

const SCHOOL_NAMES: Record<string, string> = {
  'A': 'Abjuration',
  'C': 'Conjuration',
  'D': 'Divination',
  'E': 'Enchantment',
  'V': 'Evocation',
  'I': 'Illusion',
  'N': 'Necromancy',
  'T': 'Transmutation',
}

const SCHOOL_COLORS: Record<string, { from: string; to: string; fromLight: string; toLight: string; text: string; textLight: string; glow: string }> = {
  'Abjuration': { from: 'from-blue-500', to: 'to-cyan-400', fromLight: 'light:from-blue-800', toLight: 'light:to-cyan-800', text: 'text-blue-400', textLight: 'light:text-blue-900', glow: 'shadow-blue-500/50' },
  'Conjuration': { from: 'from-yellow-700', to: 'to-amber-600', fromLight: 'light:from-yellow-900', toLight: '<light:to-orange-900></light:to-orange-13>00', text: 'text-yellow-600', textLight: 'light:text-yellow-900', glow: 'shadow-yellow-500/50' },
  'Divination': { from: 'from-purple-400', to: 'to-pink-400', fromLight: 'light:from-purple-800', toLight: 'light:to-fuchsia-800', text: 'text-purple-400', textLight: 'light:text-purple-900', glow: 'shadow-purple-500/50' },
  'Enchantment': { from: 'from-pink-500', to: 'to-rose-400', fromLight: 'light:from-pink-800', toLight: 'light:to-rose-800', text: 'text-pink-400', textLight: 'light:text-pink-900', glow: 'shadow-pink-500/50' },
  'Evocation': { from: 'from-red-500', to: 'to-orange-400', fromLight: 'light:from-red-800', toLight: 'light:to-orange-800', text: 'text-red-400', textLight: 'light:text-red-900', glow: 'shadow-red-500/50' },
  'Illusion': { from: 'from-indigo-500', to: 'to-purple-400', fromLight: 'light:from-indigo-800', toLight: 'light:to-purple-800', text: 'text-indigo-400', textLight: 'light:text-indigo-900', glow: 'shadow-indigo-500/50' },
  'Necromancy': { from: 'from-green-600', to: 'to-emerald-500', fromLight: 'light:from-green-900', toLight: 'light:to-emerald-900', text: 'text-green-400', textLight: 'light:text-green-950', glow: 'shadow-green-500/50' },
  'Transmutation': { from: 'from-teal-500', to: 'to-cyan-400', fromLight: 'light:from-teal-800', toLight: 'light:to-cyan-800', text: 'text-teal-400', textLight: 'light:text-teal-900', glow: 'shadow-teal-500/50' },
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
    const schoolName = SCHOOL_NAMES[spell.school] || spell.school
    const schoolColor = SCHOOL_COLORS[schoolName] || SCHOOL_COLORS['Evocation']

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
            <Badge variant="outline" className={`${schoolColor.text} ${schoolColor.textLight} border-${schoolColor.text}/30 bg-${schoolColor.text}/5 text-xs font-semibold px-2 py-0.5 transition-colors duration-300`}>
              {schoolName}
            </Badge>
          </div>

          <h2 className={`font-cinzel text-xl font-semibold mb-4 leading-tight max-w-[85%] bg-gradient-to-r ${schoolColor.from} ${schoolColor.to} ${schoolColor.fromLight} ${schoolColor.toLight} bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:opacity-90 transition-all duration-300`}>
            {spell.name}
          </h2>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Badge className={`bg-gradient-to-br ${schoolColor.from} ${schoolColor.to} ${schoolColor.fromLight} ${schoolColor.toLight} text-white shadow-lg min-w-8 h-8 px-2.5 text-base font-bold rounded-lg`}>
                {spell.level}
              </Badge>
              {spell.level === 0 && (
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold transition-colors duration-300">
                  Cantrip
                </span>
              )}
            </div>

            {extractDiceNotation(spell.entries[0]) && (
              <Badge variant="outline" className="bg-red-500/10 border-red-400/30 text-red-400 light:text-red-700 light:border-red-600/50 light:bg-red-500/20 w-fit transition-colors duration-300">
                {extractDiceNotation(spell.entries[0])}
              </Badge>
            )}

            {extractSaveNotation(spell.entries[0]) && (
              <Badge variant="outline" className="bg-blue-500/15 border-blue-400/30 text-blue-400 light:text-blue-700 light:border-blue-600/50 light:bg-blue-500/20 w-fit transition-colors duration-300">
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
