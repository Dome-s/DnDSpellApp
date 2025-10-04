import React, { useState } from 'react';
import { BsFire, BsTools, BsFillPlusCircleFill } from 'react-icons/bs';
import { AiFillHeart } from 'react-icons/ai';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { testDmgType, testHealingType, testUtilityType, testAttackRole, testSavingThrow } from '../utils/spellParsers';
import { extractAvailableClasses } from '../utils/spellFilters';
import { SPELL_LEVELS, SPELL_TYPES, CONCENTRATION_TYPES, ACTION_TYPES, RADIUS_TYPES, ATTACK_TYPES, COMPONENT_TYPES } from '../constants/spellConstants';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { StatBadge } from './ui/stat-badge';
import { LevelCounter } from './ui/level-counter';
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
  const [orderSelected, setSelectedOrder] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedConcentration, setSelectedConcentration] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedRadiusType, setSelectedRadiusType] = useState<string | null>(null);
  const [selectedAttackType, setSelectedAttackType] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string | null>(null);
  const [likedSpells, setLikedSpells] = useLocalStorage<Spell[]>('likedSpells', []);
  const [OnlyLikeChecked, setOnlyLikeChecked] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedSpell, setExpandedSpell] = useState<Spell | null>(null);

  const showOnlyLiked = () => {
    setOnlyLikeChecked(!OnlyLikeChecked);
  };

  const handleLike = (spell: Spell) => {
    setLikedSpells((prevLikedSpells: Spell[]) =>
      prevLikedSpells.some((prevSpell: Spell) => prevSpell.name === spell.name)
        ? prevLikedSpells.filter((prevSpell: Spell) => prevSpell.name !== spell.name)
        : [...prevLikedSpells, spell]
    );
  };

  const availableClasses = extractAvailableClasses(spellClasses);

  const filteredSpells = spells.filter((spell) => {
    const levelCondition = selectedLevel ? spell.level === selectedLevel - 1 : true;
    const classCondition = selectedClass
      ? spellClasses[spell.source] &&
        spellClasses[spell.source][spell.name]?.class &&
        spellClasses[spell.source][spell.name].class.some(
          (cls: any) => cls.name.toLowerCase() === selectedClass.toLowerCase()
        )
      : true;
    const likedCondition = !OnlyLikeChecked ? true : likedSpells.some((likedSpell: Spell) => likedSpell.name === spell.name);
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
        ? spell.duration[0].concentration ? true : false
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
        ? /MT|C|N|Y|S|R|Q|L|H|/.test(spell.areaTags || '')
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
  });

  return (
    <div className="flex gap-6 p-5 max-w-[2000px] mx-auto">
      <div className="w-80 min-w-80 flex flex-col gap-5">
        {/* Filter Section */}
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500 group relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5 flex flex-col gap-2.5">
            {/* Search and Like Toggle */}
            <div className="flex items-center gap-2.5">
              <Input
                type="text"
                placeholder="Search by name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={OnlyLikeChecked}
                  onCheckedChange={() => showOnlyLiked()}
                  id="liked-filter"
                />
                <label htmlFor="liked-filter" className="cursor-pointer">
                  <AiFillHeart className={OnlyLikeChecked ? "text-red-500 text-xl" : "text-white/20 text-xl"} />
                </label>
              </div>
            </div>

            {/* Sort Order */}
            <Select value={orderSelected || 'name'} onValueChange={setSelectedOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="level">Sort by Level</SelectItem>
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={selectedLevel?.toString() || 'All'} onValueChange={(val) => setSelectedLevel(val === 'All' ? null : parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Level</SelectItem>
                {SPELL_LEVELS.map((level) => (
                  <SelectItem key={level} value={(level + 1).toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={selectedClass || 'All'} onValueChange={(val) => setSelectedClass(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Class</SelectItem>
                {availableClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType || 'All'} onValueChange={(val) => setSelectedType(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Type</SelectItem>
                {SPELL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Concentration Filter */}
            <Select value={selectedConcentration || 'All'} onValueChange={(val) => setSelectedConcentration(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Concentration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Concentration type</SelectItem>
                {CONCENTRATION_TYPES.map((concentration) => (
                  <SelectItem key={concentration} value={concentration}>
                    {concentration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select value={selectedAction || 'All'} onValueChange={(val) => setSelectedAction(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Action type</SelectItem>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Radius Filter */}
            <Select value={selectedRadiusType || 'All'} onValueChange={(val) => setSelectedRadiusType(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Radius type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Radius type</SelectItem>
                {RADIUS_TYPES.map((radius) => (
                  <SelectItem key={radius} value={radius}>
                    {radius}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Attack Type Filter */}
            <Select value={selectedAttackType || 'All'} onValueChange={(val) => setSelectedAttackType(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Attack type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Attack type</SelectItem>
                {ATTACK_TYPES.map((attack) => (
                  <SelectItem key={attack} value={attack}>
                    {attack}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Component Filter */}
            <Select value={selectedComponentType || 'All'} onValueChange={(val) => setSelectedComponentType(val === 'All' ? null : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Exclude Component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Exclude Component</SelectItem>
                {COMPONENT_TYPES.map((component) => (
                  <SelectItem key={component} value={component}>
                    {component}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Liked Info Box */}
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500 group relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-5">
            <h3 className="font-cinzel text-lg font-semibold mb-3 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
              <AiFillHeart className="text-red-500 animate-bounce-subtle" />
              Liked Spells
            </h3>
            <div className="text-sm font-semibold text-foreground mb-3 p-2.5 bg-cyan-500/15 rounded-lg border border-cyan-500/30">
              Total: {likedSpells.length} Spell{likedSpells.length !== 1 ? 's' : ''}
            </div>

            {/* Level Counters */}
            <div className="grid grid-cols-5 gap-1.5 my-2.5">
              {SPELL_LEVELS.map((level) => {
                const count = likedSpells.filter((spell: Spell) => spell.level === level).length;
                const maxCount = Math.max(...SPELL_LEVELS.map((l) => likedSpells.filter((s: Spell) => s.level === l).length), 1);
                return (
                  <LevelCounter key={level} level={level} count={count} maxCount={maxCount} />
                );
              })}
            </div>

            {/* Action Types */}
            <div className="flex gap-4 mt-3 flex-wrap">
              <StatBadge>A {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'action').length}</StatBadge>
              <StatBadge>BA {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'bonus').length}</StatBadge>
              <StatBadge>R {likedSpells.filter((spell: Spell) => spell.time[0].unit === 'reaction').length}</StatBadge>
            </div>

            {/* Spell Types */}
            <div className="flex gap-4 mt-3 flex-wrap">
              <StatBadge icon={<BsFire className="text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.6)]" title="number of damage spells" />}>
                {likedSpells.filter((spell: Spell) => testDmgType(spell.entries[0])).length}
              </StatBadge>
              <StatBadge icon={<BsFillPlusCircleFill className="text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]" title="number of healing spells" />}>
                {likedSpells.filter((spell: Spell) => testHealingType(spell.entries[0])).length}
              </StatBadge>
              <StatBadge icon={<BsTools className="text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.6)]" title="number of utility spells" />}>
                {likedSpells.filter((spell: Spell) => testUtilityType(spell.entries[0])).length}
              </StatBadge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spell Cards Container */}
      <div className="flex-1 flex justify-center">
        <ScrollArea className="w-full max-h-[calc(100vh-40px)]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-1 content-start">
            {filteredSpells &&
              filteredSpells
                .sort((a, b) => {
                  let filter = a.name.localeCompare(b.name);
                  filter = orderSelected === 'level' ? a.level - b.level : filter;
                  return filter;
                })
                .map((spell, index) => (
                  <SpellCard
                    key={`${spell.name}-${spell.source}-${index}`}
                    spell={spell}
                    isLiked={likedSpells.some((likedSpell: Spell) => likedSpell.name === spell.name)}
                    onLike={handleLike}
                    onClick={setExpandedSpell}
                  />
                ))}
          </div>
        </ScrollArea>
      </div>

      {/* Expanded Spell Modal */}
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
