import React, { useState } from 'react';
import { AiFillHeart } from 'react-icons/ai';
import { SlidersHorizontal } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { testDmgType, testHealingType, testUtilityType, testAttackRole, testSavingThrow } from '../utils/spellParsers';
import { extractAvailableClasses } from '../utils/spellFilters';
import { SPELL_LEVELS, SPELL_TYPES, CONCENTRATION_TYPES, ACTION_TYPES, RADIUS_TYPES, ATTACK_TYPES, COMPONENT_TYPES } from '../constants/spellConstants';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { StatBadge } from './ui/stat-badge';
import { LevelCounter } from './ui/level-counter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { SpellCard } from './SpellCard';
import { SpellDetailsModal } from './SpellDetailsModal';

interface Spell {
  name: string;
  level: number;
  school: string;
  time: { number?: number; unit: string }[];
  range: { distance?: { amount?: number; type?: string } };
  components: { v?: boolean; s?: boolean; m?: any };
  duration: { concentration?: boolean; type?: string; duration?: { amount?: number; type?: string } }[];
  entries: any[];
  source: string;
  miscTags?: string[];
  areaTags?: string;
  entriesHigherLevel?: any[];
}

interface SpellListProps {
  spells: Spell[];
  spellClasses: any;
}

const SpellList: React.FC<SpellListProps> = ({ spells, spellClasses }) => {
  const [orderSelected, setSelectedOrder] = useState<string>('name');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedConcentration, setSelectedConcentration] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedRadiusType, setSelectedRadiusType] = useState<string | null>(null);
  const [selectedAttackType, setSelectedAttackType] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string | null>(null);
  const [likedSpells, setLikedSpells] = useLocalStorage<Spell[]>('likedSpells', []);
  const [onlyLikedChecked, setOnlyLikedChecked] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedSpell, setExpandedSpell] = useState<Spell | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const availableClasses = extractAvailableClasses(spellClasses);

  const resetFilters = () => {
    setSelectedOrder('name');
    setSelectedLevel(null);
    setSelectedClass(null);
    setSelectedType(null);
    setSelectedConcentration(null);
    setSelectedAction(null);
    setSelectedRadiusType(null);
    setSelectedAttackType(null);
    setSelectedComponentType(null);
    setOnlyLikedChecked(false);
    setSearchInput('');
  };

  const handleLike = (spell: Spell) => {
    setLikedSpells((prevLikedSpells: Spell[]) =>
      prevLikedSpells.some((prevSpell: Spell) => prevSpell.name === spell.name)
        ? prevLikedSpells.filter((prevSpell: Spell) => prevSpell.name !== spell.name)
        : [...prevLikedSpells, spell]
    );
  };

  const filteredSpells = spells
    .filter((spell) => {
      const levelCondition = selectedLevel !== null ? spell.level === selectedLevel : true;
      const classCondition = selectedClass
        ? spellClasses[spell.source] &&
          spellClasses[spell.source][spell.name]?.class &&
          spellClasses[spell.source][spell.name].class.some(
            (cls: any) => cls.name.toLowerCase() === selectedClass.toLowerCase()
          )
        : true;
      const likedCondition = !onlyLikedChecked ? true : likedSpells.some((likedSpell: Spell) => likedSpell.name === spell.name);
      const searchCondition = searchInput ? spell.name.toLowerCase().includes(searchInput.toLowerCase()) : true;
      const typeCondition = selectedType
        ? selectedType === 'dmg'
          ? testDmgType(spell.entries[0])
          : selectedType === 'healing'
          ? testHealingType(spell.miscTags?.join(',') || '')
          : selectedType === 'utility'
          ? testUtilityType(spell.entries[0])
          : true
        : true;
      const concentrationCondition = selectedConcentration
        ? selectedConcentration === 'concentration'
          ? !!spell.duration[0].concentration
          : selectedConcentration === 'no concentration'
          ? !spell.duration[0].concentration
          : true
        : true;
      const actionCondition = selectedAction
        ? selectedAction === 'action'
          ? spell.time[0].unit === 'action'
          : selectedAction === 'reaction'
          ? spell.time[0].unit === 'reaction'
          : selectedAction === 'bonus action'
          ? spell.time[0].unit === 'bonus'
          : true
        : true;
      const radiusCondition = selectedRadiusType
        ? selectedRadiusType === 'area'
          ? /MT|C|N|Y|S|R|Q|L|H/.test(spell.areaTags || '')
          : selectedRadiusType === 'self'
          ? spell.range.distance?.type === 'self'
          : selectedRadiusType === 'single target'
          ? /ST/.test(spell.areaTags || '')
          : true
        : true;
      const attackTypeCondition = selectedAttackType
        ? selectedAttackType === 'attack role'
          ? testAttackRole(spell.entries[0])
          : selectedAttackType === 'saving throw'
          ? testSavingThrow(spell.entries[0])
          : true
        : true;
      const componentCondition = selectedComponentType
        ? selectedComponentType === 'verbal'
          ? !spell.components.v
          : selectedComponentType === 'semantic'
          ? !spell.components.s
          : selectedComponentType === 'material'
          ? !spell.components.m
          : true
        : true;

      return (
        levelCondition &&
        classCondition &&
        likedCondition &&
        searchCondition &&
        typeCondition &&
        concentrationCondition &&
        actionCondition &&
        radiusCondition &&
        attackTypeCondition &&
        componentCondition
      );
    })
    .sort((a, b) => (orderSelected === 'level' ? a.level - b.level || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)));

  const filtersActive =
    selectedLevel !== null ||
    selectedClass ||
    selectedType ||
    selectedConcentration ||
    selectedAction ||
    selectedRadiusType ||
    selectedAttackType ||
    selectedComponentType ||
    onlyLikedChecked ||
    searchInput;

  const FilterControls = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? 'space-y-3' : 'space-y-3'}>
      <div className="space-y-2">
        <label htmlFor={compact ? 'mobile-spell-search' : 'spell-search'} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Search
        </label>
        <Input
          id={compact ? 'mobile-spell-search' : 'spell-search'}
          type="text"
          placeholder="Magic missile..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-11 bg-input text-base md:text-sm"
        />
      </div>

      <button
        type="button"
        id={compact ? 'mobile-liked-filter' : 'liked-filter'}
        aria-pressed={onlyLikedChecked}
        className={`liked-filter-toggle ${onlyLikedChecked ? 'is-active' : ''}`}
        onClick={() => setOnlyLikedChecked((checked) => !checked)}
      >
        <AiFillHeart className={onlyLikedChecked ? 'text-red-500' : 'text-muted-foreground'} aria-hidden="true" />
        Only liked spells
      </button>

      <Select value={orderSelected} onValueChange={setSelectedOrder}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Sort by Name</SelectItem>
          <SelectItem value="level">Sort by Level</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedLevel !== null ? selectedLevel.toString() : 'All'} onValueChange={(val) => setSelectedLevel(val === 'All' ? null : parseInt(val, 10))}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Levels</SelectItem>
          {SPELL_LEVELS.map((level) => (
            <SelectItem key={level} value={level.toString()}>
              {level === 0 ? 'Cantrips' : `Level ${level}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedClass || 'All'} onValueChange={(val) => setSelectedClass(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Class" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Classes</SelectItem>
          {availableClasses.map((cls) => (
            <SelectItem key={cls} value={cls}>
              {cls}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType || 'All'} onValueChange={(val) => setSelectedType(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          {SPELL_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedConcentration || 'All'} onValueChange={(val) => setSelectedConcentration(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Concentration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any Concentration</SelectItem>
          {CONCENTRATION_TYPES.map((concentration) => (
            <SelectItem key={concentration} value={concentration}>
              {concentration}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAction || 'All'} onValueChange={(val) => setSelectedAction(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any Action</SelectItem>
          {ACTION_TYPES.map((action) => (
            <SelectItem key={action} value={action}>
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedRadiusType || 'All'} onValueChange={(val) => setSelectedRadiusType(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Targeting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any Targeting</SelectItem>
          {RADIUS_TYPES.map((radius) => (
            <SelectItem key={radius} value={radius}>
              {radius}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAttackType || 'All'} onValueChange={(val) => setSelectedAttackType(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Resolution" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any Resolution</SelectItem>
          {ATTACK_TYPES.map((attack) => (
            <SelectItem key={attack} value={attack}>
              {attack}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedComponentType || 'All'} onValueChange={(val) => setSelectedComponentType(val === 'All' ? null : val)}>
        <SelectTrigger className="h-11 bg-input">
          <SelectValue placeholder="Exclude component" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">No Component Exclusion</SelectItem>
          {COMPONENT_TYPES.map((component) => (
            <SelectItem key={component} value={component}>
              Exclude {component}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" className="h-11 w-full" onClick={resetFilters} disabled={!filtersActive}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="spell-browser-layout mx-auto grid max-w-[1400px] grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <Card className="rounded-lg border-border bg-card shadow-[var(--shadow-card)]">
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c0a66d]">Filters</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Spell Browser</h2>
              </div>
              <FilterControls />
            </CardContent>
          </Card>
        </div>
      </aside>

      <main className="spell-results-column min-w-0">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Showing</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              <span className="tabular-nums">{filteredSpells.length}</span> of <span className="tabular-nums">{spells.length}</span> spells
            </h2>
          </div>
          <Button type="button" variant="outline" className="h-11 justify-center lg:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </Button>
        </div>

        <Card className="mb-4 rounded-lg border-border bg-card shadow-[var(--shadow-card)]">
          <CardContent className="liked-summary-grid p-4">
            <div className="liked-summary-total">
              <p className="text-sm text-muted-foreground">Liked spells</p>
              <span className="text-2xl font-semibold tabular-nums text-foreground">{likedSpells.length}</span>
            </div>
            <div className="liked-summary-levels">
              {SPELL_LEVELS.map((level) => {
                const count = likedSpells.filter((spell: Spell) => spell.level === level).length;
                const maxCount = Math.max(...SPELL_LEVELS.map((l) => likedSpells.filter((s: Spell) => s.level === l).length), 1);
                return <LevelCounter key={level} level={level} count={count} maxCount={maxCount} />;
              })}
            </div>
            <div className="liked-summary-tags">
              <StatBadge>A {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'action').length}</StatBadge>
              <StatBadge>BA {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'bonus').length}</StatBadge>
              <StatBadge>R {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'reaction').length}</StatBadge>
              <StatBadge>{likedSpells.filter((spell: Spell) => testDmgType(spell.entries[0])).length} dmg</StatBadge>
              <StatBadge>{likedSpells.filter((spell: Spell) => testHealingType(spell.entries[0])).length} heal</StatBadge>
              <StatBadge>{likedSpells.filter((spell: Spell) => testUtilityType(spell.entries[0])).length} util</StatBadge>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="spell-results-scroll w-full">
          {filteredSpells.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4 pb-2 pr-1">
              {filteredSpells.map((spell, index) => (
                <SpellCard
                  key={`${spell.name}-${spell.source}-${index}`}
                  spell={spell}
                  isLiked={likedSpells.some((likedSpell: Spell) => likedSpell.name === spell.name)}
                  onLike={handleLike}
                  onClick={setExpandedSpell}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border-border bg-card shadow-[var(--shadow-card)]">
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
                <h3 className="text-xl font-semibold text-foreground">No spells match these filters.</h3>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">Clear one or more filters to return to the full index.</p>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </main>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="mobile-filter-dialog max-h-[85vh] overflow-y-auto rounded-t-2xl border-border bg-card p-4">
          <DialogHeader className="mb-2 text-left">
            <DialogTitle className="text-lg font-semibold">Filter Spells</DialogTitle>
          </DialogHeader>
          <FilterControls compact />
        </DialogContent>
      </Dialog>

      <SpellDetailsModal
        spell={expandedSpell}
        isOpen={!!expandedSpell}
        onClose={() => setExpandedSpell(null)}
        isLiked={expandedSpell ? likedSpells.some((likedSpell: Spell) => likedSpell.name === expandedSpell.name) : false}
        onLike={handleLike}
        spellClasses={spellClasses}
      />
    </div>
  );
};

export default SpellList;
