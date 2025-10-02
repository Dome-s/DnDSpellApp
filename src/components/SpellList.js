import React, { useState } from 'react';
import { BsFire, BsTools, BsFillPlusCircleFill } from 'react-icons/bs';
import { AiFillHeart } from 'react-icons/ai';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { extractDiceNotation, extractSaveNotation, testDmgType, testHealingType, testUtilityType, testAttackRole, testSavingThrow } from '../utils/spellParsers';
import { extractAvailableClasses } from '../utils/spellFilters';
import { SPELL_LEVELS, SPELL_TYPES, CONCENTRATION_TYPES, ACTION_TYPES, RADIUS_TYPES, ATTACK_TYPES, COMPONENT_TYPES } from '../constants/spellConstants';
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
  const [likedSpells, setLikedSpells] = useLocalStorage('likedSpells', []);
  const [OnlyLikeChecked, setOnlyLikeChecked] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedSpell, setExpandedSpell] = useState(null);

  const showOnlyLiked = () => {
    setOnlyLikeChecked(!OnlyLikeChecked);
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

  const availableClasses = extractAvailableClasses(spellClasses);

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
      <select value={orderSelected || ''} onChange={(e) => setSelectedOrder(e.target.value)}>
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
        {SPELL_LEVELS.map((level) => (
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
        {SPELL_TYPES.map((type) => (
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
        {CONCENTRATION_TYPES.map((concentration) => (
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
        {ACTION_TYPES.map((action) => (
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
        {RADIUS_TYPES.map((radius) => (
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
        {ATTACK_TYPES.map((attack) => (
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
        {COMPONENT_TYPES.map((component) => (
          <option key={component} value={component}>
            {component}
          </option>
        ))}
      </select> 
      </div>
      <div className="liked-info-box">
        <h3>Liked Spells Information</h3>
        <p>Total Liked Spells: {likedSpells.length}</p>
        <p>Level : {SPELL_LEVELS.map((level) => ("lvl " +level+":" + likedSpells.filter((spell) => spell.level === level).length)+"; ")} </p>
        <div className="actiontypes">
        <p className="actiontype">A {likedSpells.filter((spell) => spell.time[0].unit === "action").length} </p>
        <p className="actiontype">BA {likedSpells.filter((spell) => spell.time[0].unit === "bonus").length} </p>
        <p className="actiontype">R  {likedSpells.filter((spell) => spell.time[0].unit === "reaction").length}</p>
        </div>
        <div className="selectedtypes">
        <p className="selectedtype"><BsFire className='damage' title="number of damage spells"/> {likedSpells.filter((spell) => testDmgType(spell.entries[0])).length} </p>
        <p className="selectedtype"><BsFillPlusCircleFill className='healing' title="number of healing spells"/> {likedSpells.filter((spell) => testHealingType(spell.entries[0])).length} </p>
        <p className="selectedtype"><BsTools className='utility' title="number of utility spells"/>  {likedSpells.filter((spell) => testUtilityType(spell.entries[0])).length} </p>
        </div>
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
            <div
              key={`${spell.name}-${spell.source}-${index}`}
              className="card card-compact"
              onClick={() => setExpandedSpell(spell)}
            >
              <button
                className="likeButton"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(spell);
                }}
              >
                {likedSpells.some((likedSpell) => likedSpell.name === spell.name) ?  <AiFillHeart className='unlike' /> : <AiFillHeart className='like' />}
              </button>
              <h2>{spell.name}</h2>
              <div className="general-infos">
                <p>Level: {spell.level}</p>
                <p>{extractDiceNotation(spell.entries[0])}</p>
                <p>{extractSaveNotation(spell.entries[0])}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Spell Modal */}
      {expandedSpell && (
        <div className="spell-modal-overlay" onClick={() => setExpandedSpell(null)}>
          <div className="spell-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="spell-modal-close" onClick={() => setExpandedSpell(null)}>×</button>
            <button
              className="likeButton"
              onClick={() => handleLike(expandedSpell)}
              style={{position: 'absolute', top: '20px', right: '60px'}}
            >
              {likedSpells.some((likedSpell) => likedSpell.name === expandedSpell.name) ?  <AiFillHeart className='unlike' /> : <AiFillHeart className='like' />}
            </button>
            <h2>{expandedSpell.name}</h2>
            <div className="general-infos">
              <p><strong>Level:</strong> {expandedSpell.level}</p>
              <p>{extractDiceNotation(expandedSpell.entries[0])}</p>
              <p>{extractSaveNotation(expandedSpell.entries[0])}</p>
            </div>
            <div className="details">
              <div className="infos">
                <p><strong>Cast Time:</strong> {expandedSpell.time[0].number +" "+ expandedSpell.time[0].unit}</p>
                <p><strong>Concentration:</strong> {expandedSpell.duration[0].concentration ? "yes" : "no"}</p>
                <p><strong>Duration:</strong> {expandedSpell.duration[0].type ==="instant" ? expandedSpell.duration[0].type : expandedSpell.duration[0].duration?.amount +" "+ expandedSpell.duration[0].duration?.type}</p>
                <p>
                  <strong>Range:</strong> {expandedSpell.range.distance?.amount
                    ? expandedSpell.range.distance.amount + 'ft'
                    : expandedSpell.range.distance?.type}
                </p>
                <p>
                  <strong>Components:</strong>
                  {expandedSpell.components.v ? ' v' : ''}
                  {expandedSpell.components.s ? ' s' : ''}
                  {expandedSpell.components.m ? expandedSpell.components.m?.text ? " m: "+expandedSpell.components.m.text : " m: "+ expandedSpell.components.m : ""}
                </p>
              </div>
              {expandedSpell.entries.map((entry,index) => (
                <div key={`modal-entry-${expandedSpell.name}-${index}`}>
                  {typeof entry === 'string' ? <p>{entry.replace(/{@(\w+) ([^}]+)}/g, '$2')}</p> : null}
                  {entry?.entries ? <p>{index}. {entry.entries[0].replace(/{@(\w+) ([^}]+)}/g, '$2')}</p>: null }
                </div>
              ))}
              <p>{expandedSpell.entriesHigherLevel ? expandedSpell.entriesHigherLevel[0].entries[0].replace(/{@(\w+) ([^|}]+)\|?[^}]*}/g, '$2') : ""}</p>
              <p><strong>Classes:</strong> {spellClasses[expandedSpell.source][expandedSpell.name]?.class?.map(cls => cls.name).join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellList;
