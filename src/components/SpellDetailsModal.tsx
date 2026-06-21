import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
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

export interface SpellDetailsModalProps {
  spell: Spell | null
  isOpen: boolean
  onClose: () => void
  isLiked: boolean
  onLike: (spell: Spell) => void
  spellClasses: any
}

const cleanText = (value: string) => value.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, "$2")

const formatLevel = (level: number) => (level === 0 ? "Cantrip" : `Level ${level}`)

const formatDuration = (spell: Spell) => {
  const duration = spell.duration[0]
  if (duration.type === "instant") return "Instant"
  if (duration.duration?.amount && duration.duration?.type) return `${duration.duration.amount} ${duration.duration.type}`
  return duration.type
}

const formatRange = (spell: Spell) => {
  const distance = spell.range.distance
  if (!distance) return "Unknown"
  if (distance.amount) return `${distance.amount} ft`
  return distance.type || "Unknown"
}

const formatComponents = (spell: Spell) => {
  const components = []
  if (spell.components.v) components.push("V")
  if (spell.components.s) components.push("S")
  if (spell.components.m) {
    const material = spell.components.m?.text || spell.components.m
    components.push(material ? `M: ${material}` : "M")
  }
  return components.join(", ") || "None"
}

export const SpellDetailsModal: React.FC<SpellDetailsModalProps> = ({
  spell,
  isOpen,
  onClose,
  isLiked,
  onLike,
  spellClasses,
}) => {
  if (!spell) return null

  const dice = extractDiceNotation(spell.entries[0])
  const save = extractSaveNotation(spell.entries[0])
  const classes = spellClasses[spell.source][spell.name]?.class?.map((cls: any) => cls.name).join(", ")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-card p-0 shadow-[var(--shadow-card)]">
        <div className="border-b border-border p-5 pr-14 sm:p-6 sm:pr-16">
          <DialogHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-border bg-secondary text-muted-foreground">
                {formatLevel(spell.level)}
              </Badge>
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
            <DialogTitle className="font-cinzel text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {spell.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Source: {spell.source}{classes ? ` · Classes: ${classes}` : ""}
            </DialogDescription>
          </DialogHeader>

          <LikeButton
            isLiked={isLiked}
            onClick={() => onLike(spell)}
            className="absolute right-12 top-5 h-10 w-10 sm:top-6"
          />
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <section className="rounded-lg border border-border bg-secondary/60 p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Casting Notes</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Cast Time</dt>
                <dd className="font-medium text-foreground">
                  {spell.time[0].number ? `${spell.time[0].number} ` : ""}
                  {spell.time[0].unit}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Range</dt>
                <dd className="font-medium text-foreground">{formatRange(spell)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium text-foreground">{formatDuration(spell)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Concentration</dt>
                <dd className="font-medium text-foreground">{spell.duration[0].concentration ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Components</dt>
                <dd className="break-words font-medium text-foreground">{formatComponents(spell)}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</h3>
            <div className="space-y-4 text-sm leading-7 text-secondary-foreground">
              {spell.entries.map((entry: any, index: number) => (
                <React.Fragment key={`modal-entry-${spell.name}-${index}`}>
                  {typeof entry === "string" && <p>{cleanText(entry)}</p>}
                  {entry?.entries && <p>{cleanText(entry.entries[0])}</p>}
                </React.Fragment>
              ))}
              {spell.entriesHigherLevel && (
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">At Higher Levels</h4>
                  <p>{cleanText(spell.entriesHigherLevel[0].entries[0])}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
