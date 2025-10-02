/**
 * Utility functions for parsing spell data from D&D 5e JSON format
 */

/**
 * Extracts dice notation (e.g., "1d6 fire damage") from spell description text
 * @param {string} text - The spell description text
 * @returns {Array|null} Array of damage dice notations or null if none found
 */
export const extractDiceNotation = (text) => {
  const regex = /\d+d\d+\s*(\w+\s+)?damage/gi;
  const matches = text.replace(/{@(\w+) ([^}]+)}/g, '$2').match(regex);

  if (matches) {
    return matches.map((match) => match);
  }

  return null;
};

/**
 * Extracts saving throw requirements from spell description
 * @param {string} text - The spell description text
 * @returns {string|null} First saving throw found or null
 */
export const extractSaveNotation = (text) => {
  const regex = /\b\w+\b saving throw\b/gi;
  const matches = text.replace(/{@(\w+) ([^}]+)}/g, '$2').match(regex);

  if (matches) {
    return matches[0];
  }

  return null;
};

/**
 * Tests if spell is a damage-dealing spell
 * @param {string} text - The spell description text
 * @returns {boolean} True if spell deals damage
 */
export const testDmgType = (text) => {
  return /\d+d\d+\s+(\w+\s+)?damage/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'));
};

/**
 * Tests if spell is a healing spell
 * @param {string} text - The spell miscTags string
 * @returns {boolean} True if spell has healing tag
 */
export const testHealingType = (text) => {
  return /HL/i.test(text);
};

/**
 * Tests if spell is a utility spell (neither damage nor healing)
 * @param {string} text - The spell description text
 * @returns {boolean} True if spell is utility
 */
export const testUtilityType = (text) => {
  return !(testDmgType(text) || testHealingType(text));
};

/**
 * Tests if spell requires an attack roll
 * @param {string} text - The spell description text
 * @returns {boolean} True if spell requires spell attack
 */
export const testAttackRole = (text) => {
  return /spell attack/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'));
};

/**
 * Tests if spell requires a saving throw
 * @param {string} text - The spell description text
 * @returns {boolean} True if spell requires saving throw
 */
export const testSavingThrow = (text) => {
  return /saving throw/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'));
};

/**
 * Strips special formatting tags from spell text (e.g., {@damage 1d6} becomes "1d6")
 * @param {string} text - Text with special formatting tags
 * @returns {string} Clean text without formatting tags
 */
export const stripFormattingTags = (text) => {
  return text.replace(/{@(\w+) ([^}]+)}/g, '$2');
};
