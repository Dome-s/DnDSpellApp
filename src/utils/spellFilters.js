import { testDmgType, testHealingType, testUtilityType, testAttackRole, testSavingThrow } from './spellParsers';

/**
 * Filter spells based on multiple criteria
 * @param {Array} spells - Array of spell objects
 * @param {Object} filters - Filter configuration object
 * @param {Object} spellClasses - Spell class data
 * @param {Array} likedSpells - Array of liked spells
 * @returns {Array} Filtered array of spells
 */
export const filterSpells = (spells, filters, spellClasses, likedSpells) => {
  const {
    selectedLevel,
    selectedClass,
    selectedType,
    selectedConcentration,
    selectedAction,
    selectedRadiusType,
    selectedAttackType,
    selectedComponentType,
    searchInput,
    OnlyLikeChecked
  } = filters;

  return spells.filter((spell) => {
    const levelCondition = selectedLevel ? spell.level === selectedLevel - 1 : true;

    const classCondition = selectedClass
      ? spellClasses[spell.source] &&
        spellClasses[spell.source][spell.name]?.class &&
        spellClasses[spell.source][spell.name].class.some(
          (cls) => cls.name.toLowerCase() === selectedClass.toLowerCase()
        )
      : true;

    const likedCondition = !OnlyLikeChecked
      ? true
      : likedSpells.some((likedSpell) => likedSpell.name === spell.name);

    const searchCondition = searchInput
      ? spell.name.toLowerCase().includes(searchInput.toLowerCase())
      : true;

    const typeCondition = selectedType
      ? selectedType === 'dmg'
        ? testDmgType(spell.entries[0])
        : selectedType === 'healing'
        ? testHealingType(spell.miscTags)
        : selectedType === 'utility'
        ? testUtilityType(spell.entries[0])
        : true
      : true;

    const concentrationCondition = selectedConcentration
      ? selectedConcentration === 'concentration'
        ? spell.duration[0].concentration ? true : false
        : selectedConcentration === 'no concentration'
        ? !(spell.duration[0].concentration ? true : false)
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
        ? /MT|C|N|Y|S|R|Q|L|H|/.test(spell.areaTags)
        : selectedRadiusType === 'self'
        ? spell.range.distance?.type === 'self'
        : selectedRadiusType === 'single target'
        ? /ST/.test(spell.areaTags)
        : true
      : true;

    const attackTypeCondition = selectedAttackType
      ? selectedAttackType === 'attack roll'
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
};

/**
 * Extract available classes from spell class data
 * @param {Object} spellClasses - Spell class data object
 * @returns {Array} Sorted array of unique class names
 */
export const extractAvailableClasses = (spellClasses) => {
  return Array.from(
    new Set(
      Object.values(spellClasses)
        .flatMap((book) =>
          Object.values(book)?.flatMap((spells) =>
            spells?.class?.map((cls) => cls?.name.toLowerCase())
          )
        )
        .filter((x) => x !== undefined)
    )
  );
};
