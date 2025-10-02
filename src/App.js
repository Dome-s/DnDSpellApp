import './App.css';
import SpellList from './components/SpellList';
import spellsDataPHB from './data/Spells_PHB.json';
import spellsDataFTD from './data/Spells_FTD.json';
import spellsDataIDROTF from './data/Spells_IDROTF.json';
import spellsDataSCC from './data/Spells_SCC.json';
import spellsDataTCE from './data/Spells_TCE.json';
import spellsDataTDCSR from './data/Spells_TDCSR.json';
import spellsDataXGE from './data/Spells_XGE.json';
import spellsClassesData from './data/Sources.json';
/*
idrotf = Icewind Dale: Rime of the Frostmaiden
xge = xanathars guide to everything
tdcsr = TalDorei Campaign setting reborn
scc = Strixhaven: A Curriculum of Chaos
tce = tashas cauldron of everything
ftd = fizbans treasury of Dragons
*/


const combinedSpells = [
  ...spellsDataPHB.spell,
  ...spellsDataFTD.spell,
  ...spellsDataIDROTF.spell,
  ...spellsDataSCC.spell,
  ...spellsDataTCE.spell,
  ...spellsDataTDCSR.spell,
  ...spellsDataXGE.spell,
];

const App = () => {
  return (
    <SpellList spells={combinedSpells} spellClasses={spellsClassesData} />
  );
};

export default App;
