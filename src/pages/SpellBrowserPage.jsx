import React, { useMemo } from 'react';
import SpellList from '../components/SpellList.tsx';
import spellsDataPHB from '../data/Spells_PHB.json';
import spellsDataFTD from '../data/Spells_FTD.json';
import spellsDataIDROTF from '../data/Spells_IDROTF.json';
import spellsDataSCC from '../data/Spells_SCC.json';
import spellsDataTCE from '../data/Spells_TCE.json';
import spellsDataTDCSR from '../data/Spells_TDCSR.json';
import spellsDataXGE from '../data/Spells_XGE.json';
import spellsClassesData from '../data/Sources.json';
import './SpellBrowserPage.css';

const SpellBrowserPage = () => {
  // Memoize the combined spells array to prevent recalculation
  const combinedSpells = useMemo(() => [
    ...spellsDataPHB.spell,
    ...spellsDataFTD.spell,
    ...spellsDataIDROTF.spell,
    ...spellsDataSCC.spell,
    ...spellsDataTCE.spell,
    ...spellsDataTDCSR.spell,
    ...spellsDataXGE.spell,
  ], []);

  return (
    <div className="min-h-screen spell-browser-wrapper">
      <div className="spell-browser-hero">
        <p className="spell-browser-kicker">D&amp;D 5E Tool</p>
        <h1>D&amp;D Spell Browser</h1>
        <p>
          Search and prepare spells from multiple 5th Edition sourcebooks with
          compact filters, saved favorites, and readable spell details.
        </p>
      </div>
      <SpellList spells={combinedSpells} spellClasses={spellsClassesData} />
    </div>
  );
};

export default SpellBrowserPage;
