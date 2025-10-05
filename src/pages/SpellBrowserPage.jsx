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
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold mb-2">
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)]">
           D&D Spell Browser
          </span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto drop-shadow-sm transition-colors duration-300">
          A Filterable spelllist for Dungeons & Dragons 5th Edition Spells,
          built with React and TypeScript. using data from a compiled List of Json Files.
        </p>
      </div>
      <SpellList spells={combinedSpells} spellClasses={spellsClassesData} />
    </div>
  );
};

export default SpellBrowserPage;
