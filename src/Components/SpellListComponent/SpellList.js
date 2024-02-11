import React, { useState,useEffect  } from 'react';
import Collapsible from 'react-collapsible';
import { BsChevronDown} from 'react-icons/bs';
import { AiFillHeart } from "react-icons/ai";
import './SpellList.css';

const SpellList = ({ spells, spellClasses }) => {
  const [orderSelected, setSelectedOrder] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedConcentration, setSelectedConcentration] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRadiusType, setSelectedRadiusType] = useState(null);
  const [selectedAttackType, setSelectedAttackType] = useState(null);
  const [selectedComponentType, setSelectedComponentType] = useState(null);
  const [likedSpells, setLikedSpells] = useState(() => {
    const storedLikedSpells = localStorage.getItem('likedSpells');
    return storedLikedSpells ? JSON.parse(storedLikedSpells) : [];
  });
  const [OnlyLikeChecked, setOnlyLikeChecked] = React.useState(false);
  const [searchInput, setSearchInput] = useState('');

  const showOnlyLiked = () => {
    setOnlyLikeChecked(!OnlyLikeChecked);
  };

  useEffect(() => {
    localStorage.setItem('likedSpells', JSON.stringify(likedSpells));
  }, [likedSpells]);

  const extractDiceNotation = (text) => {
    const regex = /\d+d\d+\s*(\w+\s+)?damage/gi;
    const matches = text.replace(/{@(\w+) ([^}]+)}/g, '$2').match(regex);

    if (matches) {
      return matches.map((match, index) => (
        match
      ));
    }

    return null;
  };
  const extractSaveNotation = (text) => {
    const regex = /\b\w+\b saving throw\b/gi;
    const matches = text.replace(/{@(\w+) ([^}]+)}/g, '$2').match(regex);

    if (matches) {
      return matches[0]
    }

    return null;
  };


  const handleLike = (spell) => {
    setLikedSpells((prevLikedSpells) =>
      prevLikedSpells.some((prevSpell) => prevSpell.name === spell.name)
        ? prevLikedSpells.filter((prevSpell) => prevSpell.name !== spell.name)
        : [...prevLikedSpells, spell]
    );
  };

  const filterSpells = (event) => {
    const { name, value } = event.target
   
    if (name === 'level') {
      setSelectedLevel(value === 'All' ? null : parseInt(value));
    } else if (name === 'class') {
      setSelectedClass(value === 'All' ? null : value);
    } else if (name === 'type') {
      setSelectedType(value === 'All' ? null : value);
    }else if (name === 'concentration') {
      setSelectedConcentration(value === 'All' ? null : value);
    }else if (name === 'action') {
      setSelectedAction(value === 'All' ? null : value);
    }else if (name === 'radius') {
      setSelectedRadiusType(value === 'All' ? null : value);
    }else if (name === 'attack') {
      setSelectedAttackType(value === 'All' ? null : value);
    }else if (name === 'component') {
      setSelectedComponentType(value === 'All' ? null : value);
    }
  };

  const availableClasses = Array.from(
    new Set(
      Object.values(spellClasses)
        .flatMap((book) =>
          Object.values(book)?.flatMap((spells) =>
            spells?.class?.map((cls) => cls?.name.toLowerCase()),
          )
        ).filter(x => x !== undefined)
    )
  );

  const testDmgType = (text) => {
    return /\d+d\d+\s+(\w+\s+)?damage/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'))
  }
  const testHealingType = (text) => {
    return /HL/i.test(text)
  }
  const testUtilityType = (text) => {
    return !(testDmgType(text) || testHealingType(text))
  }
  const testAttackRole = (text) => {
    return /spell attack/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'))
  }
  const testSavingThrow = (text) => {
    return /saving throw/i.test(text.replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2'))
  }

  const filteredSpells = spells.filter((spell) => {
    const levelCondition =  selectedLevel ? spell.level === selectedLevel -1: true;
    const classCondition = selectedClass ?
      spellClasses[spell.source] && spellClasses[spell.source][spell.name]?.class && spellClasses[spell.source][spell.name].class.some(
      (cls) => cls.name.toLowerCase() === selectedClass.toLowerCase()
      ) : true;
    const likedCondition = !(OnlyLikeChecked ) ? true : likedSpells.some((likedSpell) => likedSpell.name === spell.name)
    const searchCondition = searchInput ? spell.name.toLowerCase().includes(searchInput.toLowerCase()) : true;
    const typeCondition = selectedType ? 
      selectedType === "dmg" ? testDmgType(spell.entries[0]) : 
      selectedType === "healing" ? testHealingType(spell.miscTags) : 
      selectedType === "utility" ? testUtilityType(spell.entries[0]) : true : true;
    const concentrationCondition = selectedConcentration ? 
      selectedConcentration === "concentration" ? (spell.duration[0].concentration ? true : false) :
      selectedConcentration === "no concentration" ? !(spell.duration[0].concentration ? true : false)  :true :true;
    const actionCondition = selectedAction ? 
      selectedAction === "action" ? spell.time[0].unit === "action" :
      selectedAction === "reaction" ? spell.time[0].unit === "reaction" :
      selectedAction === "bonus action" ? spell.time[0].unit === "bonus"  :true :true;
    const radiusCondition = selectedRadiusType ? 
      selectedRadiusType === "area" ? /MT|C|N|Y|S|R|Q|L|H|/.test(spell.areaTags) :
      selectedRadiusType === "self" ? spell.range.distance?.type === "self" :
      selectedRadiusType === "single target" ? /ST/.test(spell.areaTags)   :true :true;
    const attackTypeCondition = selectedAttackType ? 
      selectedAttackType === "attack role" ? testAttackRole(spell.entries[0]) :
      selectedAttackType === "saving throw" ? testSavingThrow(spell.entries[0])   :true :true;
    const componentCondition = selectedComponentType ?
      selectedComponentType === "verbal" ? !spell.components.v :
      selectedComponentType === "semantic" ? !spell.components.s   :
      selectedComponentType === "material" ? !spell.components.m   :true :true;

    return levelCondition && classCondition && likedCondition && searchCondition && typeCondition 
            && concentrationCondition &&  actionCondition && radiusCondition && attackTypeCondition && componentCondition; 
  });

  

  return (
    <div className="spell-list">
      <div className='info-Container'>
      <div className='filter'>
      <input
          className='search'
          type="text"
          placeholder="Search by name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
       <label className="filterLabel">
       <AiFillHeart className='unlike' />
        <input
          type="checkbox"
          checked={OnlyLikeChecked}
          onChange={showOnlyLiked}
          className={OnlyLikeChecked ? "checked" : ""}
        />
      </label>
      <label className="filterLabel" htmlFor="OrderDropdown"></label>
      <select value={orderSelected} onChange={(e) => setSelectedOrder(e.target.value)}>
        <option value="name">Sort by Name</option>
        <option value="level">Sort by Level</option>
      </select>
      <label className="filterLabel" htmlFor="levelDropdown"></label>
      <select
        id="levelDropdown"
        name="level"
        onChange={filterSpells}
        value={selectedLevel || 'All'}
      >
        <option value="All">Level</option>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
          <option key={level} value={level+1}>
            Level {level}
          </option>
        ))}
      </select>

      <label className="filterLabel" htmlFor="classDropdown"></label>
      <select
        id="classDropdown"
        name="class"
        onChange={filterSpells}
        value={selectedClass || 'All'}
      >
        <option value="All">Class</option>
        {availableClasses.map((cls) => (
          <option key={cls} value={cls}>
            {cls}
          </option>
        ))}
      </select>
      <label className="filterLabel" htmlFor="TypeDropDown"></label>
      <select
        id="TypeDropDown"
        name="type"
        onChange={filterSpells}
        value={selectedType || 'All'}
      >
        <option value="All">Type</option>
        {["dmg","utility","healing"].map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <label className="filterLabel" htmlFor="ConcentrationDropdown"></label>
      <select
        id="ConcentrationDropdown"
        name="concentration"
        onChange={filterSpells}
        value={selectedConcentration || 'All'}
      >
        <option value="All">Concentration type</option>
        {["concentration","no concentration"].map((concentration) => (
          <option key={concentration} value={concentration}>
            {concentration}
          </option>
        ))}
      </select>
      <label className="filterLabel" htmlFor="ActionDropdown"></label>
      <select
        id="ActionDropdown"
        name="action"
        onChange={filterSpells}
        value={selectedAction || 'All'}
      >
        <option value="All">Action type</option>
        {["action","bonus action","reaction"].map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select> 
      <label className="filterLabel" htmlFor="RadiusDropdown"></label>
      <select
        id="RadiusDropdown"
        name="radius"
        onChange={filterSpells}
        value={selectedRadiusType || 'All'}
      >
        <option value="All">Radius type</option>
        {["single target","area","self"].map((radius) => (
          <option key={radius} value={radius}>
            {radius}
          </option>
        ))}
      </select> 
      <label className="filterLabel" htmlFor="attackTypeDropdown"></label>
      <select
        id="attackTypeDropdown"
        name="attack"
        onChange={filterSpells}
        value={selectedAttackType || 'All'}
      >
        <option value="All">Attack type</option>
        {["attack role","saving throw"].map((attack) => (
          <option key={attack} value={attack}>
            {attack}
          </option>
        ))}
      </select> 
      <label className="filterLabel" htmlFor="ComponentDropdown"></label>
      <select
        id="ComponentDropdown"
        name="component"
        onChange={filterSpells}
        value={selectedComponentType || 'All'} 
      >
        <option value="All">Exclude Component</option>
        {["verbal","semantic","material"].map((component) => (
          <option key={component} value={component}>
            {component}
          </option>
        ))}
      </select> 
      </div>
      <div className="liked-info-box">
        <h3>Liked Spells Information</h3>
        <p>Total Liked Spells: {likedSpells.length}</p>
        <p>Level : {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => ("lvl " +level+":" + likedSpells.filter((spell) => spell.level === level).length)+"; ")} </p>
        <p>Action: {likedSpells.filter((spell) => spell.time[0].unit === "action").length}</p>
        <p>Bonus Action: {likedSpells.filter((spell) => spell.time[0].unit === "bonus").length}</p>
        <p>reaction: {likedSpells.filter((spell) => spell.time[0].unit === "reaction").length}</p>
        <p>Damage: {likedSpells.filter((spell) => testDmgType(spell.entries[0])).length}</p>
        <p>Healing: {likedSpells.filter((spell) => testHealingType(spell.entries[0])).length}</p>
        <p>Utility: {likedSpells.filter((spell) => testUtilityType(spell.entries[0])).length}</p>
      </div>
    </div>
     
      <div className="card-container">
        <div className="scrollable-container">
          {filteredSpells && filteredSpells.sort((a, b) => {
                      var filter = a.name.localeCompare(b.name)
                      filter = orderSelected === "level" ?  a.level - b.level : filter ;
                      return filter;
                    })
          .map((spell, index) => (
            <div key={index} className="card">
              <button className="likeButton" onClick={() => handleLike(spell)}>
                {likedSpells.some((likedSpell) => likedSpell.name === spell.name) ?  <AiFillHeart className='unlike' /> : <AiFillHeart className='like' />}
              </button>
              <h2>{spell.name}</h2>
              <div className="general-infos">
                <p>Level: {spell.level}</p>
                <p>{extractDiceNotation(spell.entries[0])}</p>
                <p>{extractSaveNotation(spell.entries[0])}</p>
              </div>
              <Collapsible className='details' trigger={['Details', <BsChevronDown />]}>
                <div className="infos">
                  <p>Cast Time: {spell.time[0].number +" "+ spell.time[0].unit}</p>
                  <p>Concentration: {spell.duration[0].concentration ? "yes" : "no"}</p>
                  <p>Duration: {spell.duration[0].type ==="instant" ? spell.duration[0].type : spell.duration[0].duration?.amount +" "+ spell.duration[0].duration?.type}</p>
                  <p>
                    Range: {spell.range.distance?.amount
                      ? spell.range.distance.amount + 'ft'
                      : spell.range.distance?.type}
                  </p>
                  <p>
                    Components: 
                    {spell.components.v ? ' v' : ''}
                    {spell.components.s ? ' s' : ''} 
                    {spell.components.m ? spell.components.m?.text ? " m: "+spell.components.m.text : " m: "+ spell.components.m : ""}
                  </p>
                </div>
                {spell.entries.map((entry,index) => (
                  <div>
                    {typeof entry === 'string' ? <p>{entry.replace(/{@(\w+) ([^}]+)}/g, '$2')}</p> : null}
                    {entry?.entries ? <p>{index}. {entry.entries[0].replace(/{@(\w+) ([^}]+)}/g, '$2')}</p>: null }
                  </div>
                ))}
                <p>{spell.entriesHigherLevel ? spell.entriesHigherLevel[0].entries[0].replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2') : ""}</p>
                <p>Classes: {spellClasses[spell.source][spell.name]?.class?.map(cls => cls.name).join(', ')}</p>
              </Collapsible>
              
            </div>
          ))} 
        </div>
      </div>
    </div>
  );
};

export default SpellList;
