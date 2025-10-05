import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
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

export const SpellDetailsModal: React.FC<SpellDetailsModalProps> = ({
  spell,
  isOpen,
  onClose,
  isLiked,
  onLike,
  spellClasses,
}) => {
  if (!spell) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-background/95 border-border/50">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-3xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent pr-10">
            {spell.name}
          </DialogTitle>
        </DialogHeader>

        <LikeButton
          isLiked={isLiked}
          onClick={() => onLike(spell)}
          className="absolute top-5 right-14"
        />

        <div className="space-y-4">
          {/* Quick Info Section */}
          <div className="p-4 bg-white/5 light:bg-black/5 rounded-xl space-y-2 transition-colors duration-300">
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Level:</strong> {spell.level}
            </p>
            {extractDiceNotation(spell.entries[0]) && (
              <p className="text-sm text-secondary-foreground transition-colors duration-300">
                {extractDiceNotation(spell.entries[0])}
              </p>
            )}
            {extractSaveNotation(spell.entries[0]) && (
              <p className="text-sm text-secondary-foreground transition-colors duration-300">
                {extractSaveNotation(spell.entries[0])}
              </p>
            )}
          </div>

          {/* Spell Statistics Section */}
          <div className="p-5 bg-white/5 light:bg-black/5 rounded-xl space-y-2 transition-colors duration-300">
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Cast Time:</strong> {spell.time[0].number} {spell.time[0].unit}
            </p>
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Concentration:</strong> {spell.duration[0].concentration ? 'yes' : 'no'}
            </p>
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Duration:</strong>{' '}
              {spell.duration[0].type === 'instant'
                ? spell.duration[0].type
                : `${spell.duration[0].duration?.amount} ${spell.duration[0].duration?.type}`}
            </p>
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Range:</strong>{' '}
              {spell.range.distance?.amount
                ? `${spell.range.distance.amount}ft`
                : spell.range.distance?.type}
            </p>
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Components:</strong>
              {spell.components.v ? ' v' : ''}
              {spell.components.s ? ' s' : ''}
              {spell.components.m
                ? spell.components.m?.text
                  ? ` m: ${spell.components.m.text}`
                  : ` m: ${spell.components.m}`
                : ''}
            </p>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            {spell.entries.map((entry: any, index: number) => (
              <div key={`modal-entry-${spell.name}-${index}`}>
                {typeof entry === 'string' ? (
                  <p className="text-sm text-secondary-foreground leading-relaxed transition-colors duration-300">
                    {entry.replace(/{@(\w+) ([^}]+)}/g, '$2')}
                  </p>
                ) : null}
                {entry?.entries ? (
                  <p className="text-sm text-secondary-foreground leading-relaxed transition-colors duration-300">
                    {index}. {entry.entries[0].replace(/{@(\w+) ([^}]+)}/g, '$2')}
                  </p>
                ) : null}
              </div>
            ))}
            {spell.entriesHigherLevel && (
              <p className="text-sm text-secondary-foreground leading-relaxed transition-colors duration-300">
                {spell.entriesHigherLevel[0].entries[0].replace(
                  /{@(\w+) ([^|}]+)\|?[^}]*}/g,
                  '$2'
                )}
              </p>
            )}
            <p className="text-sm text-secondary-foreground transition-colors duration-300">
              <strong>Classes:</strong>{' '}
              {spellClasses[spell.source][spell.name]?.class
                ?.map((cls: any) => cls.name)
                .join(', ')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
