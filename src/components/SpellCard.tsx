import * as React from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { LikeButton } from "./ui/like-button"
import { extractDiceNotation, extractSaveNotation } from "../utils/spellParsers"

const SCHOOL_NAMES: Record<string, string> = {
  A: "Abjuration",
  C: "Conjuration",
  D: "Divination",
  E: "Enchantment",
  V: "Evocation",
  I: "Illusion",
  N: "Necromancy",
  T: "Transmutation",
}

const SCHOOL_ACCENTS: Record<string, string> = {
  Abjuration: "#6bb6c9",
  Conjuration: "#c0a66d",
  Divination: "#a78bfa",
  Enchantment: "#d88aa4",
  Evocation: "#dc7a5c",
  Illusion: "#8ea0d8",
  Necromancy: "#7eaa7b",
  Transmutation: "#73b7a7",
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

const formatLevel = (level: number) => (level === 0 ? "Cantrip" : `Level ${level}`)

const formatRange = (spell: Spell) => {
  const distance = spell.range.distance
  if (!distance) return "Range unknown"
  if (distance.amount) return `${distance.amount} ft`
  return distance.type || "Range unknown"
}

export const SpellCard = React.forwardRef<HTMLDivElement, SpellCardProps>(
  ({ spell, isLiked, onLike, onClick }, ref) => {
    const schoolName = SCHOOL_NAMES[spell.school] || spell.school
    const accent = SCHOOL_ACCENTS[schoolName] || SCHOOL_ACCENTS.Evocation
    const dice = extractDiceNotation(spell.entries[0])
    const save = extractSaveNotation(spell.entries[0])

    return (
      <Card
        ref={ref}
        role="button"
        tabIndex={0}
        className="group relative min-h-[210px] cursor-pointer overflow-hidden rounded-lg border-border bg-card shadow-[var(--shadow-card)] outline-none hover:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onClick(spell)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick(spell)
          }
        }}
        style={{ borderTopColor: accent, borderTopWidth: 3 }}
      >
        <CardContent className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge
                variant="outline"
                className="mb-3 rounded-full border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {schoolName}
              </Badge>
              <h2 className="max-w-[92%] text-balance font-cinzel text-xl font-semibold leading-tight text-foreground">
                {spell.name}
              </h2>
            </div>
            <LikeButton
              isLiked={isLiked}
              onClick={(event) => {
                event.stopPropagation()
                onLike(spell)
              }}
              className="h-10 w-10 shrink-0"
              animated={isLiked}
            />
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Circle</p>
              <p className="font-medium text-foreground">{formatLevel(spell.level)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cast</p>
              <p className="font-medium text-foreground">
                {spell.time[0].number ? `${spell.time[0].number} ` : ""}
                {spell.time[0].unit}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Range</p>
              <p className="font-medium text-foreground">{formatRange(spell)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Focus</p>
              <p className="font-medium text-foreground">{spell.duration[0].concentration ? "Concentration" : "No"}</p>
            </div>
          </div>

          {(dice || save) && (
            <div className="flex flex-wrap gap-2">
              {dice && (
                <Badge variant="outline" className="rounded-full border-border bg-secondary text-secondary-foreground">
                  Damage {dice}
                </Badge>
              )}
              {save && (
                <Badge variant="outline" className="rounded-full border-border bg-secondary text-secondary-foreground">
                  Save {save}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
SpellCard.displayName = "SpellCard"
