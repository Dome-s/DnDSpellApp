import logo from './logo.svg';
import './App.css';
import SpellList from './Components/SpellListComponent/SpellList.js'; 
import spellsDataPHB from './Spells_PHB.json'; 
import spellsDataFTD from './Spells_FTD.json'; 
import spellsDataIDROTF from './Spells_IDROTF.json'; 
import spellsDataSCC from './Spells_SCC.json'; 
import spellsDataTCE from './Spells_TCE.json'; 
import spellsDataTDCSR from './Spells_TDCSR.json'; 
import spellsDataXGE from './Spells_XGE.json'; 
import spellsClassesData from './Sources.json';
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
