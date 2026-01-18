import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Custom border styles
const borderStyle = {
  boxShadow: `
    inset 0 0 0 3px rgba(230, 230, 230, 0.9), 
    inset 0 0 0 6px #000,
    0 8px 32px 0 rgba(0, 0, 0, 0.37)
  `,
  background: `
    linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    rgba(255, 255, 255, 0.05)
  `,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

const smallBorderStyle = {
  boxShadow: `
    inset 0 0 0 2px rgba(230, 230, 230, 0.9), 
    inset 0 0 0 4px #000,
    0 4px 16px 0 rgba(0, 0, 0, 0.25)
  `,
  background: `
    linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    rgba(255, 255, 255, 0.05)
  `,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

// Core Classes
class Race {
  constructor(name, statGrowthRules, forms = []) {
    this.name = name;
    this.statGrowthRules = statGrowthRules;
    this.forms = forms;
  }

  getBaseStats(level) {
    const stats = {
      hpMax: 0,
      kiMax: 0,
      meleeDamage: 0,
      kiDamage: 0,
      meleeResistance: 0,
      kiResistance: 0,
      speed: 0
    };

    Object.keys(this.statGrowthRules).forEach(stat => {
      const rule = this.statGrowthRules[stat];
      const levelsGained = Math.floor(level / rule.every);
      stats[stat] = levelsGained * rule.amount;
    });

    return stats;
  }
}

class Form {
  constructor(name, stackable, bonusType, bonusStats, ignoreMastery = [], icon = 'form-icon.png', customMasteryMultipliers = null, statBonusTypes = null, tags = []) {
    this.name = name;
    this.stackable = stackable;
    this.bonusType = bonusType; // 'flat' or 'multiplier' - default for all stats
    this.bonusStats = bonusStats;
    this.ignoreMastery = ignoreMastery;
    this.icon = icon;
    this.customMasteryMultipliers = customMasteryMultipliers; // { normal: 1.0, mastered: 1.3, perfected: 2.0 }
    this.statBonusTypes = statBonusTypes; // { statName: 'multiplier' or 'flat', ... } - overrides bonusType per stat
    this.tags = tags; // ['goodKi', ...] - tags to identify special forms
  }

  getBonus(masteryLevel = 'normal') {
    // Use custom multipliers if provided, otherwise use default
    const masteryMultipliers = this.customMasteryMultipliers || {
      normal: 1.0,
      mastered: 1.25,
      perfected: 1.5
    };

    const multiplier = masteryMultipliers[masteryLevel];
    const bonus = {};

    Object.keys(this.bonusStats).forEach(stat => {
      const baseValue = this.bonusStats[stat];
      const shouldIgnoreMastery = this.ignoreMastery.includes(stat);
      // Use stat-specific bonus type if provided, otherwise use the default bonusType
      const statType = this.statBonusTypes && this.statBonusTypes[stat] ? this.statBonusTypes[stat] : this.bonusType;
      
      if (statType === 'flat') {
        bonus[stat] = shouldIgnoreMastery 
          ? baseValue 
          : Math.floor(baseValue * multiplier);
      } else {
        bonus[stat] = shouldIgnoreMastery 
          ? baseValue 
          : baseValue * multiplier;
      }
    });

    return bonus;
  }
}

class NPC {
  constructor(name, stats) {
    this.name = name;
    this.stats = stats; // { hpMax, kiMax, meleeDamage, kiDamage, meleeResistance, kiResistance, speed }
  }
}

class Capsule {
  constructor(name, category = 'Passive', icon = 'capsule-icon.png', affectsStats = false, statBonuses = {}, isPercentage = {}, description = '') {
    this.name = name;
    this.category = category; // 'Active', 'Passive', 'Raid/Dungeon', 'Halloween'
    this.icon = icon;
    this.affectsStats = affectsStats; // boolean - does this capsule affect stats?
    this.statBonuses = statBonuses; // { statName: value, ... } for capsules that affect stats
    this.isPercentage = isPercentage; // { statName: boolean, ... } - true if the bonus is percentage-based
    this.description = description; // Effect description
  }
}

class Move {
  constructor(name, category = 'Ki', allowedRaces = null) {
    this.name = name;
    this.category = category; // 'Ki', 'Melee', 'Other', 'Race-Exclusive', 'Event'
    this.allowedRaces = allowedRaces; // null (available to all) or array of race names/subraces
  }
}

// All Moves
const sampleMoves = [
  // Ki Moves
  new Move('Energy Wave', 'Ki'),
  new Move('Double Sunday', 'Ki'),
  new Move('Masenko', 'Ki'),
  new Move('Kamehameha', 'Ki'),
  new Move('Death Beam', 'Ki'),
  new Move('Tri-Beam', 'Ki'),
  new Move('Destructo Disk', 'Ki'),
  new Move('Burning Attack', 'Ki'),
  new Move('Super Energy Blast Volley', 'Ki'),
  new Move('Big Bang Attack', 'Ki'),
  new Move('Neo Tri-Beam', 'Ki'),
  new Move('Galick Gun', 'Ki'),
  new Move('Special Beam Cannon', 'Ki'),
  new Move('Spirit Ball', 'Ki'),
  new Move('Senko Ki Blast', 'Ki'),
  new Move('One-Hand Kamehameha', 'Ki'),
  new Move('Heat Dome Attack', 'Ki'),
  new Move('Solar Flare', 'Ki'),
  new Move('Final Flash', 'Ki'),
  new Move('Instant Severance', 'Ki'),
  new Move('Super Kamehameha', 'Ki'),
  new Move('Spirit Bomb', 'Ki'),
  new Move('Crusher Ball', 'Ki'),
  new Move('Sudden Storm', 'Ki'),
  new Move('Milky Cannon', 'Ki'),
  new Move('Super Nova', 'Ki'),
  new Move('Dragon Twin Fist', 'Ki'),
  new Move('Genocide Shell', 'Ki'),
  new Move('Murder Grenade', 'Ki'),
  new Move('Telekinetic Grab', 'Ki'),
  new Move('Brave Heat', 'Ki'),
  new Move('Tyrant Lancer', 'Ki'),
  new Move('Wild Rush Blaster', 'Ki'),
  new Move('Emperor\'s Edge', 'Ki'),
  new Move('G.O.D Anger', 'Ki'),
  
  // Melee Moves
  new Move('Dragon Throw', 'Melee'),
  new Move('Elbow Smash', 'Melee'),
  new Move('Rush', 'Melee'),
  new Move('Sledgehammer', 'Melee'),
  new Move('Wolf Fang Fist', 'Melee'),
  new Move('Dirty Fireworks', 'Melee'),
  new Move('Launcher', 'Melee'),
  new Move('Final Blow', 'Melee'),
  new Move('Mach Kick', 'Melee'),
  new Move('Bone Crush', 'Melee'),
  new Move('Flip Kick', 'Melee'),
  new Move('Combo Barrage', 'Melee'),
  new Move('Trash', 'Melee'),
  new Move('Meteor Crash', 'Melee'),
  new Move('Dive Kick', 'Melee'),
  new Move('Spirit Breaking Cannon', 'Melee'),
  new Move('Super Rush', 'Melee'),
  new Move('Strike of Revelation', 'Melee'),
  new Move('Hyper Tornado', 'Melee'),
  new Move('Double Launcher', 'Melee'),
  new Move('Strong Kick', 'Melee'),
  new Move('Justice Combination', 'Melee'),
  new Move('Punisher Drive', 'Melee'),
  new Move('Strong Punch', 'Melee'),
  new Move('Somersault Kick', 'Melee'),
  new Move('Second Bloom', 'Melee'),
  new Move('Kick Barrage', 'Melee'),
  new Move('Drop Kick', 'Melee'),
  new Move('Dragon Crush', 'Melee'),
  new Move('Feint Crash', 'Melee'),
  new Move('Fierce Combination', 'Melee'),
  new Move('Deadly Dance', 'Melee'),
  
  // Other / Miscellaneous Moves
  new Move('Ki Deflect', 'Other'),
  new Move('Explosive Wave', 'Other'),
  new Move('Instant Rise', 'Other'),
  new Move('Image Training', 'Other'),
  new Move('After-Image Feint', 'Other'),
  new Move('Z-Vanish', 'Other'),
  new Move('Instant Transmission', 'Other'),
  new Move('Backflip', 'Other'),
  new Move('Capsule Tracker', 'Other'),
  new Move('Bingo Book', 'Other'),
  new Move('Bounty Board', 'Other'),
  new Move('Fusion', 'Other'),
  new Move('Dragon Radar', 'Other'),
  new Move('Dragonball Bag', 'Other'),
  new Move('Champion\'s Sigil', 'Other'),
  
  // Race-Exclusive / Special Moves
  new Move('Gum Gum Pistol', 'Race-Exclusive', ['Tuffle', 'Majin', 'Namekian', 'Alien:Mushroom']),
  new Move('Gum Gum Bazooka', 'Race-Exclusive', ['Tuffle', 'Majin', 'Namekian', 'Alien:Mushroom']),
  new Move('Candy Beam', 'Race-Exclusive', ['Human', 'Majin']),
  new Move('Ki Drain', 'Race-Exclusive', ['Android']),
  new Move('Focus Antennae', 'Race-Exclusive', ['Namekian']),
  new Move('Rage', 'Race-Exclusive', ['Saiyan', 'Majin', "Jiren"]),
  new Move('Inspire', 'Race-Exclusive', ['Human', 'Alien', 'Namekian']),
  new Move('Protection', 'Race-Exclusive', ['Human', 'Alien', 'Majin', 'Namekian']),
  new Move('Absorb', 'Race-Exclusive', ['Majin']),
  new Move('Possession', 'Race-Exclusive', ['Tuffle']),
  new Move('Sleep', 'Race-Exclusive', ['Majin', 'Alien:Beerus']),
  new Move('Taunt', 'Race-Exclusive', ['Saiyan', "Jiren", 'Namekian', 'Frieza']),
  new Move('Self Destruct', 'Race-Exclusive', ['Alien:Saibaman']),
  
  // Event Moves (Remastered) - Unlocked through holiday/seasonal events
  new Move('Ghost Kamikaze Attack', 'Event'),
  new Move('Big Bang Kamehameha', 'Event'),
  new Move('Death Ball', 'Event'),
  new Move('Giant Storm', 'Event'),
  new Move('Jolly Wave', 'Event'),
  new Move('Jolly Shell', 'Event'),
  new Move('Bloody Smash', 'Event'),
  new Move('Ultimate Rush', 'Event'),
  new Move('Sonic Sway', 'Event')
];

const npcList = [
  new NPC('Soldier 1', { hpMax: 50, kiMax: 25, meleeDamage: 15, kiDamage: 15, meleeResistance: 10, kiResistance: 10, speed: 10 }),
  new NPC('Captain', { hpMax: 100, kiMax: 75, meleeDamage: 50, kiDamage: 50, meleeResistance: 40, kiResistance: 40, speed: 45 }),
  new NPC('Elite Guard', { hpMax: 150, kiMax: 100, meleeDamage: 80, kiDamage: 80, meleeResistance: 70, kiResistance: 70, speed: 75 })
];

// Alien subraces with different stat growth rates
const alienSubraces = {
  'Generic': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Beerus': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1.5, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 0.5, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Appule': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1.5, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 0.5, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Pikon': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 0.5, every: 2 }
  },
  'Burter': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 0.5, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1.5, every: 2 }
  },
  'Dodorian': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 0.5, every: 2 },
    kiDamage: { amount: 0.5, every: 2 },
    meleeResistance: { amount: 1.5, every: 2 },
    kiResistance: { amount: 1.5, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Saibaman': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Mushroom': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  },
  'Yardratian': {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }
};

class CharacterBuild {
  constructor(race, level) {
    this.race = race;
    this.level = level;
    this.manualStats = {
      hpMax: 0,
      kiMax: 0,
      meleeDamage: 0,
      kiDamage: 0,
      meleeResistance: 0,
      kiResistance: 0,
      speed: 0
    };
    this.activeForms = [];
    this.absorptionStats = { // For Majin absorption
      hpMax: 0,
      kiMax: 0,
      meleeDamage: 0,
      kiDamage: 0,
      meleeResistance: 0,
      kiResistance: 0,
      speed: 0
    };
    this.capsules = []; // Active capsules
  }

  getFreeStatPoints() {
    const spent = Object.values(this.manualStats).reduce((a, b) => a + b, 0);
    return this.level - spent;
  }

  getBaseStats() {
    return this.race.getBaseStats(this.level);
  }

  getFinalStats() {
    const baseStats = this.getBaseStats();
    const stats = { ...baseStats };

    Object.keys(this.manualStats).forEach(stat => {
      stats[stat] += this.manualStats[stat];
    });

    this.activeForms.forEach(({ form, mastery }) => {
      const bonus = form.getBonus(mastery);
      Object.keys(bonus).forEach(stat => {
        // Determine the type for this specific stat
        const statType = form.statBonusTypes && form.statBonusTypes[stat] ? form.statBonusTypes[stat] : form.bonusType;
        
        if (statType === 'multiplier') {
          stats[stat] = Math.floor(stats[stat] * bonus[stat]);
        } else {
          stats[stat] += bonus[stat];
        }
      });
    });

    // Add absorption bonuses (for Majin)
    Object.keys(this.absorptionStats).forEach(stat => {
      stats[stat] += this.absorptionStats[stat];
    });

    // Add capsule bonuses
    this.capsules.forEach(capsule => {
      if (capsule && capsule.affectsStats) {
        Object.keys(capsule.statBonuses).forEach(stat => {
          const value = capsule.statBonuses[stat];
          if (capsule.isPercentage[stat]) {
            // Percentage-based bonus
            stats[stat] = Math.floor(stats[stat] * (1 + value));
          } else {
            // Flat bonus
            stats[stat] += value;
          }
        });
      }
    });

    return stats;
  }
}

const sampleRaces = [
  new Race('Human', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [
    new Form('Kaioken', false, 'multiplier', {
      meleeDamage: 2,
      kiDamage: 2,
      meleeResistance: 1,
      kiResistance: 1,
      speed: 2
    }, [], 'kaioken-icon.png'),
    new Form('KaiokenX2', false, 'multiplier', {
      meleeDamage: 3,
      kiDamage: 3,
      meleeResistance: 1,
      kiResistance: 1,
      speed: 3
    }, [], 'kaioken-x2-icon.png'),
    new Form('KaoikenX4' , false, 'multiplier', {
     meleeDamage: 5,
      kiDamage: 5,
      meleeResistance: 1,
      kiResistance: 1,
      speed: 5
    }, [], 'kaioken-x4-icon.png'),
    new Form('Mystic', false, 'flat', {
      meleeDamage: 130,
      kiDamage: 130,
      meleeResistance: 130,
      kiResistance: 130,
      speed: 130
    }, [], 'mystic-icon.png'),
    new Form('Max Power', true, 'flat', {
      kiMax: 90,
      meleeDamage: 10,
      kiDamage: 10,
      meleeResistance: 10,
      kiResistance: 10,
      speed: 10
      }, ['kiMax'], 'max-power-icon.png'),

    new Form('Mystic Kaioken', false, 'flat', {
      meleeDamage: 260,
      kiDamage: 260,
      meleeResistance: 260,
      kiResistance: 260,
      speed: 260
    }, [], 'mystic-kaioken-icon.png'),
  ]),
  new Race('Saiyan', {
    hpMax: { amount: 1, every: 3 },
    kiMax: { amount: 1, every: 3 },
    meleeDamage: { amount: 1, every: 3 },
    kiDamage: { amount: 1, every: 3 },
    meleeResistance: { amount: 1, every: 3 },
    kiResistance: { amount: 1, every: 3 },
    speed: { amount: 1, every: 3 }
  }, [
   
    new Form('False Super Saiyan', false, 'flat', {
      meleeDamage: 30,
      kiDamage: 30,
      meleeResistance: 30,
      kiResistance: 30,
      speed: 30
    }, [], 'false-super-saiyan-icon.png'),

    new Form('Super Saiyan', false, 'flat', {
      meleeDamage: 50,
      kiDamage: 50,
      meleeResistance: 50,
      kiResistance: 50,
      speed: 50
    }, [], 'super-saiyan-icon.png'),

     new Form('Ascended Super Saiyan', false, 'flat', {
      meleeDamage: 75,
      kiDamage: 75,
      meleeResistance: 75,
      kiResistance: 75,
      speed: 0.5
       }, ['speed'], 'ascended-super-saiyan-icon.png', null, { speed: 'multiplier' }),
    
    new Form('Super Saiyan 2', false, 'flat', {
      meleeDamage: 100,
      kiDamage: 100,
      meleeResistance: 100,
      kiResistance: 100,
      speed: 100
    }, [], 'super-saiyan-2-icon.png'),
     new Form('Super Saiyan 3', false, 'flat', {
      meleeDamage: 150,
      kiDamage: 150,
      meleeResistance: 150,
      kiResistance: 150,
      speed: 150
    }, [], 'super-saiyan-3-icon.png'),
      new Form('LSSJ', false, 'flat', {
      meleeDamage: 200,
      kiDamage: 200,
      meleeResistance: 200,
      kiResistance: 200,
      speed: 200
    }, [], 'lssj-icon.png'),

      new Form('Super Saiyan God', false, 'flat', {
      meleeDamage: 5,
      kiDamage: 5,
      meleeResistance: 5,
      kiResistance: 5,
      speed: 6
    }, [], 'super-saiyan-god-icon.png', null, null, ['goodKi']),

  ]),
  new Race('Namekian', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [
    new Form('Potential Unleash', false, 'flat', {
      meleeDamage: 75,
      kiDamage: 75,
      meleeResistance: 75,
      kiResistance: 75,
      speed: 75
    }, [], 'potential-unleash-icon.png'),
    
    new Form('Ultimate Namekian', false, 'flat', {
      meleeDamage: 110,
      kiDamage: 110,
      meleeResistance: 110,
      kiResistance: 110,
      speed: 110
    }, [], 'ultimate-namekian-icon.png'),
    
    new Form('Giant Namekian', false, 'flat', {
      meleeDamage: 115,
      kiDamage: 115,
      meleeResistance: 230,
      kiResistance: 450
    }, [], 'giant-namekian-icon.png'),
    
    new Form('Orange Namekian', false, 'flat', {
      meleeDamage: 25,
      kiDamage: 25,
      meleeResistance: 25,
      kiResistance: 25,
      speed: 25
    }, [], 'orange-namekian-icon.png', null, null, ['goodKi'])
  ]),
  new Race('Frieza', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [
    new Form('Second Form', false, 'flat', {
      meleeDamage: 30,
      kiDamage: 60,
      meleeResistance: 30,
      kiResistance: 30,
      speed: 30
    }, [], 'second-form-icon.png'),
    
    new Form('Third Form', false, 'flat', {
      meleeDamage: 70,
      kiDamage: 110,
      meleeResistance: 70,
      kiResistance: 70,
      speed: 110
    }, [], 'third-form-icon.png'),
    
    new Form('Final Form', false, 'flat', {
      meleeDamage: 130,
      kiDamage: 130,
      meleeResistance: 100,
      kiResistance: 100,
      speed: 130
    }, [], 'final-form-icon.png'),
    
    new Form('Golden Form', false, 'flat', {
      meleeDamage: 250,
      kiDamage: 300,
      meleeResistance: 250,
      kiResistance: 250,
      speed: 250
    }, [], 'golden-form-icon.png'),
    
    new Form('Chrome Form', false, 'flat', {
      meleeDamage: 200,
      meleeResistance: 270,
      kiResistance: 270,
      speed: 80
    }, [], 'chrome-form-icon.png')
  ]),
  new Race('Android', {
    hpMax: { amount: 1, every: 1 },
    kiMax: { amount: 1, every: 1 },
    meleeDamage: { amount: 1, every: 1 },
    kiDamage: { amount: 1, every: 1 },
    meleeResistance: { amount: 1, every: 1 },
    kiResistance: { amount: 1, every: 1 },
    speed: { amount: 1, every: 1 }
  }, []),
  new Race('Majin', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [
    new Form('Purification', false, 'flat', {
      meleeDamage: 80,
      kiDamage: 80,
      meleeResistance: 80,
      kiResistance: 80,
      speed: 80
    }, [], 'purification-icon.png'),
    
    new Form('True Anger', false, 'flat', {
      meleeDamage: 225,
      kiDamage: 225,
      meleeResistance: 150,
      kiResistance: 150,
      speed: 150
    }, [], 'true-anger-icon.png')
  ]),
  new Race('Jiren', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [
    new Form('Emotion', false, 'flat', {
      meleeDamage: 20,
      kiDamage: 20,
      meleeResistance: 20,
      kiResistance: 20,
      speed: 20
    }, [], 'emotion-icon.png'),
    
    new Form('Half Emotion', false, 'flat', {
      meleeDamage: 40,
      kiDamage: 40,
      meleeResistance: 40,
      kiResistance: 40,
      speed: 40
    }, [], 'half-emotion-icon.png'),
    
    new Form('Full Emotion', false, 'flat', {
      meleeDamage: 100,
      kiDamage: 100,
      meleeResistance: 100,
      kiResistance: 100,
      speed: 100
    }, [], 'full-emotion-icon.png'),
    
    new Form('Fear', false, 'flat', {
      meleeDamage: 220,
      kiDamage: 220,
      meleeResistance: 220,
      kiResistance: 100,
      speed: 220
    }, [], 'fear-icon.png')
  ]),
  new Race('Alien', alienSubraces['Generic'], [
    new Form('Potential Unleash', false, 'flat', {
      meleeDamage: 75,
      kiDamage: 75,
      meleeResistance: 75,
      kiResistance: 75,
      speed: 75
    }, [], 'potential-unleash-icon.png'),
    
    new Form('Mystic', false, 'flat', {
      meleeDamage: 130,
      kiDamage: 130,
      meleeResistance: 130,
      kiResistance: 130,
      speed: 130
    }, [], 'mystic-icon.png'),
    
    new Form('Fear', false, 'flat', {
      meleeDamage: 220,
      kiDamage: 220,
      meleeResistance: 220,
      kiResistance: 100,
      speed: 220
    }, [], 'fear-icon.png'),
    
    new Form('Max Power', true, 'flat', {
      meleeDamage: 10,
      kiDamage: 10,
      meleeResistance: 10,
      kiResistance: 10,
      speed: 0
    }, ['speed'], 'max-power-icon.png'),
    
    new Form('Gigantification', false, 'flat', {
      hpMax: 200,
      kiMax: 100,
      meleeDamage: 300,
      kiDamage: 100,
      meleeResistance: 200,
      kiResistance: 50,
      speed: -100
    }, [], 'gigantification-icon.png')
  ]),
  new Race('Tuffle', {
    hpMax: { amount: 1, every: 2 },
    kiMax: { amount: 1, every: 2 },
    meleeDamage: { amount: 1, every: 2 },
    kiDamage: { amount: 1, every: 2 },
    meleeResistance: { amount: 1, every: 2 },
    kiResistance: { amount: 1, every: 2 },
    speed: { amount: 1, every: 2 }
  }, [])
];

// Sample Capsules
const sampleCapsules = [
  // Active Capsules
  new Capsule('Charge Capsule', 'Active', 'capsule-icon.png', false, {}, {}, 'Temporarily gives 3 extra vanish dodges (changing forms will remove them).'),
  new Capsule('Garden Capsule', 'Active', 'capsule-icon.png', false, {}, {}, 'A capsule containing a small garden.'),
  new Capsule('Gravity Chamber', 'Active', 'capsule-icon.png', false, {}, {}, 'Contains a gravity chamber.'),
  new Capsule('Refrigerator Capsule', 'Active', 'capsule-icon.png', false, {}, {}, 'Contains a refrigerator with 4 hetaps inside. 5 minute cooldown.'),
  new Capsule('Motorcycle Capsule', 'Active', 'capsule-icon.png', false, {}, {}, 'Spawns a ridable motorcycle.'),
  new Capsule('Respawn Capsule', 'Active', 'capsule-icon.png', false, {}, {}, 'Creates a one-time respawn point.'),
  
  // Passive Capsules
  new Capsule('Healthy Capsule', 'Passive', 'capsule-icon.png', true, { hpMax: 25 }, { hpMax: false }, 'Increases your HealthMax stat by 25.'),
  new Capsule('Power Capsule', 'Passive', 'capsule-icon.png', true, { meleeDamage: 10, kiDamage: 10 }, { meleeDamage: false, kiDamage: false }, '+10 to all damage stats.'),
  new Capsule('Weighted Clothing', 'Passive', 'capsule-icon.png', true, { speed: -0.5 }, { speed: true }, 'Reduces speed (-50% Base speed) but increases experience gained.'),
  new Capsule('Speed Capsule', 'Passive', 'capsule-icon.png', true, { speed: 25 }, { speed: false }, 'Increases your Speed by 25.'),
  new Capsule('Ki Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Gives passive ki regeneration when not transformed.'),
  new Capsule('Dodge Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Gives an extra vanish dodge.'),
  new Capsule('Life Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Gives passive health regeneration at all times.'),
  new Capsule('Demon Eye Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Heal a portion of your health when you defeat an enemy.'),
  new Capsule('Rush-down Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases the speed of your Rush attacks by 25%.'),
  new Capsule('Harmony Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases the level range that you can fuse with or possess targets (Also extends fusion duration).'),
  new Capsule('Stealth Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Enemy detection radius reduced.'),
  new Capsule('Travel Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases your maximum fast-fly speed and acceleration.'),
  new Capsule('Backstab Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Deal 5% more damage when attacking from behind.'),
  new Capsule('Zenni Bank Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces zenni lost upon death.'),
  new Capsule('Beckoning Cat', 'Passive', 'capsule-icon.png', true, { meleeResistance: -0.35, kiResistance: -0.35 }, { meleeResistance: true, kiResistance: true }, '+35% on rewarded zenni, -35% ki and melee resistance.'),
  new Capsule('Defense Capsule', 'Passive', 'capsule-icon.png', true, { meleeResistance: 10, kiResistance: 10 }, { meleeResistance: false, kiResistance: false }, '+10 to all resistance stats.'),
  new Capsule('Energizer Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases max size of Beam attacks by 20%.'),
  new Capsule('Hero\'s Flute Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, '+15% increased damage against giant-type enemies.'),
  new Capsule('Black Flash Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Create a distortion in space that greatly amplifies your physical strike.'),
  new Capsule('Iron Wall Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increased defense scaling when taking melee damage.'),
  new Capsule('Energy Field Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increased defense scaling when taking Ki damage.'),
  new Capsule('Surge Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases the charge speed of Ki-bomb attacks.'),
  new Capsule('Burning Fighter Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Transformation stats increased, but ki drain also increased.'),
  new Capsule('Dragon Jewel Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces passive ki drain on transformation.'),
  new Capsule('Hermit Shell Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Bolsters defense scaling from rear attacks.'),
  new Capsule('Power Bomb Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces max charge time of Bomb Ki attacks.'),
  new Capsule('Breakthrough Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'At below 25% HP, do more damage but skills cost more ki.'),
  new Capsule('Yardatian Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Gives extra damage to Yardratians.'),
  new Capsule('Eternal Youth Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'No EXP lost on death, but EXP passively drains.'),
  new Capsule('Steel Skin Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Incoming pierce damage decreased.'),
  new Capsule('Needle Point Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Attacks ignore part of target\'s physical resistance.'),
  new Capsule('Earthshaker Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces resistances but increases grounded combat.'),
  new Capsule('Immortality Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Revive where you fell every 60s (not in Dungeons/Raids).'),
  new Capsule('Gum Gum Rocket Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Enables chase attacks after knockback hits.'),
  new Capsule('Burst Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'On Zenkai trigger, send out shockwave flinging enemies.'),
  new Capsule('Pure Warrior Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Extra damage to evil-natured players (outside Tournament).'),
  new Capsule('Wicked Warrior Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Extra damage to good-natured players (outside Tournament).'),
  new Capsule('Bottomfeeder Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduce damage from guard break attacks.'),
  new Capsule('Magnet Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Draw nearby dungeon drops when objects break.'),
  new Capsule('Vandalizer Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Recover ki when nearby objects are destroyed.'),
  new Capsule('Equilibrium Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Nerfs form stat gains but reduces drain.'),
  new Capsule('Trauma Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces pierce damage taken for limited hits.'),
  new Capsule('Sponge Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Recover ki when hit by basic attacks.'),
  new Capsule('Get Away Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Charging knocks back nearby enemies.'),
  new Capsule('Battle Hardened Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduces self-damage from forms.'),
  new Capsule('Steamroll Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Boost damage for minutes after defeating enemies (NPCs).'),
  new Capsule('Featherweight Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Reduce resistances but increase speed.'),
  new Capsule('Bastion Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'More resistances as your health gets lower.'),
  new Capsule('Celebrity Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Increases enemy detection radius.'),
  new Capsule('Weak Energy Capsule', 'Passive', 'capsule-icon.png', false, {}, {}, 'Weaker beams that can no longer clash.'),
  
  // Raid/Dungeon Capsules
  new Capsule('Reversal Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Get health back on hit instead of ki.'),
  new Capsule('Overdrive Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Skills cost 0 ki during first 3s after transforming.'),
  new Capsule('Earthling Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Extra damage to Humans.'),
  new Capsule('Blast Amplifier Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Increases basic Ki Blast damage.'),
  new Capsule('Sadistic Dance Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Slow enemies you guard break.'),
  new Capsule('Immovable Object Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Reduces fling placement time.'),
  new Capsule('Don\'t Feel A Thing Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Survive one more hit against equal strength foes.'),
  new Capsule('Unstoppable Force Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Increases fling duration on targets.'),
  new Capsule('Intense Focus Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Charge ki 5% faster.'),
  new Capsule('Self Destruct Device Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, '(Android only) Detonate on defeat.'),
  new Capsule('Termination Program Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, '(Android only) Bonus damage to low-health targets.'),
  new Capsule('Perfectionist Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Increased stats at high health.'),
  new Capsule('Final Stand Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Buffs resistances at low health but nerfs damage.'),
  new Capsule('Never Fold Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Buffs damage at low health but nerfs resistances.'),
  new Capsule('Limit Breaking Jump Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Improved dodge vanishes for more ki.'),
  new Capsule('Mob Slayer Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Extra damage vs non-boss mobs with high HP.'),
  new Capsule('Fundamentals Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Strong basic attacks but weaker skills.'),
  new Capsule('Dragon Body Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Defense boost when above 50% ki.'),
  new Capsule('Dragon Fist Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Extra melee damage when above 50% ki.'),
  new Capsule('Dragon Feet Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Extra kick damage when above 50% ki.'),
  new Capsule('Energy Pierce Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, '+5% additional Pierce damage on Ki-Base attacks.'),
  new Capsule('Bide My Time Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Regenerate ki on pierce hits but altered pierce mechanics.'),
  new Capsule('One Arm Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Lose left arm (melee down, ki up).'),
  new Capsule('Audacious Laugh Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Stat boost on super fling.'),
  new Capsule('Vampiric Break Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Gain health on guard breaks.'),
  new Capsule('Heavy Handed Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Slightly more damage on the last hit of combos.'),
  new Capsule('Cherry on Top Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Deal additional damage over time.'),
  new Capsule('Maintain Pressure Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Recover more ki landing hits during super fling.'),
  new Capsule('Infinity Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Auto-deflect Ki blasts while high ki but lose ki blasts.'),
  new Capsule('Revenge Capsule', 'Raid/Dungeon', 'capsule-icon.png', false, {}, {}, 'Deal more damage to the last guard breaker you faced.'),
  
  // Halloween Event Capsules
  new Capsule('Blood Feud Capsule', 'Halloween', 'capsule-icon.png', false, {}, {}, 'As a Tuffle deal more damage to Saiyans; as a Saiyan deal more damage to Tuffles.'),
  new Capsule('Grounded Capsule', 'Halloween', 'capsule-icon.png', false, {}, {}, 'Removes flying ability; hitting a player temporarily disables their flight.'),
  new Capsule('Showstopper Capsule', 'Halloween', 'capsule-icon.png', false, {}, {}, 'Every 10 seconds when a target dodges, slow them and teleport behind them.'),
  new Capsule('Trick or Treat Capsule', 'Halloween', 'capsule-icon.png', false, {}, {}, 'Gain more candy from all sources.'),
  new Capsule('Vital Sphere Capsule', 'Halloween', 'capsule-icon.png', false, {}, {}, 'Boost all skill damage but take damage when releasing attacks.')
];

function CharacterBuilder() {
  const [selectedRace, setSelectedRace] = useState(sampleRaces[0]);
  const [level, setLevel] = useState(1);
  const [manualStats, setManualStats] = useState({
    hpMax: 0,
    kiMax: 0,
    meleeDamage: 0,
    kiDamage: 0,
    meleeResistance: 0,
    kiResistance: 0,
    speed: 0
  });
  const [activeForms, setActiveForms] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    forms: false,
    final: true
  });
  const [currentPage, setCurrentPage] = useState('builder');
  const [selectedCapsules, setSelectedCapsules] = useState([null, null, null, null]);
  const [capsuleSearches, setCapsuleSearches] = useState(['', '', '', '']);
  const [openCapsuleSlot, setOpenCapsuleSlot] = useState(null);
  const [selectedMoves, setSelectedMoves] = useState([null, null, null, null, null, null, null, null, null, null]);
  const [moveSearches, setMoveSearches] = useState(['', '', '', '', '', '', '', '', '', '']);
  const [openMoveSlot, setOpenMoveSlot] = useState(null);
  const [absorptionMode, setAbsorptionMode] = useState('none'); // 'none', 'player', 'npc'
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [playerAbsorptionLevel, setPlayerAbsorptionLevel] = useState(1);
  const [selectedAlienSubrace, setSelectedAlienSubrace] = useState('Generic');

  // Tuffle possession state
  const [possessionMode, setPossessionMode] = useState('none'); // 'none' or race name
  const [possessedStatPoints, setPossessedStatPoints] = useState({
    meleeDamage: 0,
    kiDamage: 0,
    meleeResistance: 0,
    kiResistance: 0,
    speed: 0
  });

  // Set page title
  useEffect(() => {
    document.title = 'FS:R Builder';
    
    // Set favicon
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = '/logo.png';
  }, []);

  // Load build from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const buildParam = params.get('b');
    
    if (buildParam) {
      try {
        const json = decodeURIComponent(escape(atob(buildParam)));
        const buildData = JSON.parse(json);
        
        const raceMap = { 'H': 'Human', 'S': 'Saiyan', 'N': 'Namekian', 'F': 'Frieza', 'A': 'Android', 'M': 'Majin', 'J': 'Jiren', 'AL': 'Alien', 'T': 'Tuffle' };
        const masteryMapReverse = { '0': 'normal', '1': 'mastered', '2': 'perfected' };
        
        // Set race
        const race = sampleRaces.find(r => r.name === raceMap[buildData.r]);
        if (race) {
          setSelectedRace(race);
        }
        
        // Set level
        if (buildData.l) {
          setLevel(buildData.l);
        }
        
        // Set manual stats
        if (buildData.m) {
          setManualStats(buildData.m);
        }
        
        // Set active forms
        if (buildData.f && race) {
          const forms = buildData.f.map(f => {
            const form = race.forms[f.i];
            return form ? { form, mastery: masteryMapReverse[f.s] } : null;
          }).filter(Boolean);
          setActiveForms(forms);
        }
        
        // Set alien subrace if applicable
        if (buildData.as) {
          setSelectedAlienSubrace(buildData.as);
        }
        
        // Set capsules
        if (buildData.c) {
          const capsules = buildData.c.map(idx => idx >= 0 ? sampleCapsules[idx] : null);
          setSelectedCapsules(capsules);
        }
        
        // Set moves
        if (buildData.mv) {
          const moves = buildData.mv.map(idx => idx >= 0 ? sampleMoves[idx] : null);
          setSelectedMoves(moves);
        }
      } catch (error) {
        console.error('Error loading build from URL:', error);
      }
    }
  }, []);

  const build = useMemo(() => {
    let buildRace = selectedRace;
    
    // Handle Alien subraces by creating a modified race with the correct stat growth
    if (selectedRace.name === 'Alien') {
      buildRace = new Race('Alien', alienSubraces[selectedAlienSubrace], selectedRace.forms);
    }
    
    const b = new CharacterBuild(buildRace, level);
    b.manualStats = { ...manualStats };
    b.activeForms = activeForms;
    
    // Set absorption stats for Majin
    if (selectedRace.name === 'Majin') {
      if (absorptionMode === 'player' && playerAbsorptionLevel > 0) {
        const absorbedBuild = new CharacterBuild(selectedRace, playerAbsorptionLevel);
        Object.keys(absorbedBuild.getBaseStats()).forEach(stat => {
          b.absorptionStats[stat] = absorbedBuild.getBaseStats()[stat];
        });
      } else if (absorptionMode === 'npc' && selectedNPC) {
        Object.keys(selectedNPC.stats).forEach(stat => {
          b.absorptionStats[stat] = selectedNPC.stats[stat];
        });
      }
    }

    // Handle Tuffle possession
    if (selectedRace.name === 'Tuffle' && possessionMode !== 'none') {
      let possessedRace = sampleRaces.find(r => r.name === possessionMode);
      if (possessedRace) {
        // If possessing Alien, use the selected subrace stats
        if (possessionMode === 'Alien') {
          possessedRace = new Race('Alien', alienSubraces[selectedAlienSubrace], possessedRace.forms);
        }
        
        // Get base stats of possessed race at current level
        const possessedBaseStats = possessedRace.getBaseStats(level);
        
        // Calculate 10% of (base stats + extra points)
        Object.keys(possessedBaseStats).forEach(stat => {
          if (stat !== 'hpMax' && stat !== 'kiMax') {
            const baseValue = possessedBaseStats[stat];
            const extraValue = possessedStatPoints[stat] || 0;
            const totalValue = baseValue + extraValue;
            const bonusValue = Math.floor(totalValue * 0.1);
            b.manualStats[stat] = (b.manualStats[stat] || 0) + bonusValue;
          }
        });
      }
    }

    // Add capsules
    b.capsules = selectedCapsules.filter(c => c !== null);
    
    return b;
  }, [selectedRace, level, manualStats, activeForms, absorptionMode, playerAbsorptionLevel, selectedNPC, selectedAlienSubrace, possessionMode, possessedStatPoints, selectedCapsules]);

  const freePoints = build.getFreeStatPoints();
  const baseStats = build.getBaseStats();
  const finalStats = build.getFinalStats();

  const handleStatInput = (stat, value) => {
    if (value === '') {
      setManualStats(prev => ({ ...prev, [stat]: 0 }));
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      setManualStats(prev => ({ ...prev, [stat]: 0 }));
      return;
    }
    
    // Calculate how many points would be spent with this new value
    const otherStats = Object.entries(manualStats)
      .filter(([k]) => k !== stat)
      .reduce((sum, [, v]) => sum + v, 0);
    
    const totalSpent = otherStats + numValue;
    
    // If over limit, cap it at max possible
    if (totalSpent > level) {
      const maxPossible = level - otherStats;
      setManualStats(prev => ({ ...prev, [stat]: Math.max(0, maxPossible) }));
    } else {
      setManualStats(prev => ({ ...prev, [stat]: numValue }));
    }
  };

  const handleReset = () => {
    setManualStats({
      hpMax: 0,
      kiMax: 0,
      meleeDamage: 0,
      kiDamage: 0,
      meleeResistance: 0,
      kiResistance: 0,
      speed: 0
    });
    setActiveForms([]);
    setLevel(1);
    setSelectedCapsules([null, null, null, null]);
    setCapsuleSearches(['', '', '', '']);
    setSelectedMoves([null, null, null, null, null, null, null, null, null, null]);
    setMoveSearches(['', '', '', '', '', '', '', '', '', '']);
  };

  const handleQuickMax = (stat) => {
    const otherStats = Object.entries(manualStats)
      .filter(([k]) => k !== stat)
      .reduce((sum, [, v]) => sum + v, 0);
    const maxPossible = level - otherStats;
    setManualStats(prev => ({ ...prev, [stat]: Math.max(0, maxPossible) }));
  };

  const raceMap = { 'Human': 'H', 'Saiyan': 'S', 'Namekian': 'N', 'Frieza': 'F', 'Android': 'A', 'Majin': 'M', 'Jiren': 'J', 'Alien': 'AL', 'Tuffle': 'T' };
  const masteryMap = { 'normal': '0', 'mastered': '1', 'perfected': '2' };

  const handleExportBuild = () => {
    const buildData = {
      r: raceMap[selectedRace.name],
      l: level,
      m: manualStats,
      f: activeForms.map(f => ({
        i: selectedRace.forms.findIndex(form => form.name === f.form.name),
        s: masteryMap[f.mastery]
      })),
      // Capsules - store indices of selected capsules
      c: selectedCapsules.map(cap => cap ? sampleCapsules.findIndex(c => c.name === cap.name) : -1),
      // Moves - store indices of selected moves
      mv: selectedMoves.map(move => move ? sampleMoves.findIndex(m => m.name === move.name) : -1)
    };
    
    // Add alien subrace if applicable
    if (selectedRace.name === 'Alien') {
      buildData.as = selectedAlienSubrace;
    }
    
    const json = JSON.stringify(buildData);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const buildUrl = `${window.location.origin}${window.location.pathname}?b=${encoded}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(buildUrl).then(() => {
      alert('Build URL copied to clipboard!');
    }).catch(() => {
      // Fallback if clipboard fails
      prompt('Copy this build URL:', buildUrl);
    });
  };

  const toggleForm = (form, mastery = 'normal') => {
    const existingIndex = activeForms.findIndex(f => f.form.name === form.name);
    
    if (existingIndex >= 0) {
      if (activeForms[existingIndex].mastery === mastery) {
        setActiveForms(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        setActiveForms(prev => prev.map((f, i) => 
          i === existingIndex ? { ...f, mastery } : f
        ));
      }
    } else {
      if (!form.stackable) {
        const hasNonStackable = activeForms.some(f => !f.form.stackable);
        if (hasNonStackable) {
          setActiveForms(prev => [
            ...prev.filter(f => f.form.stackable),
            { form, mastery }
          ]);
          return;
        }
      }
      setActiveForms(prev => [...prev, { form, mastery }]);
    }
  };

  const statNames = {
    hpMax: 'HP Max',
    kiMax: 'Ki Max',
    meleeDamage: 'Melee Damage',
    kiDamage: 'Ki Damage',
    meleeResistance: 'Melee Resistance',
    kiResistance: 'Ki Resistance',
    speed: 'Speed'
  };

  const Section = ({ title, id, children }) => (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden" style={borderStyle}>
      <button
        onClick={() => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))}
        className="w-full px-2 py-1.5 bg-gray-700 bg-opacity-60 flex items-center justify-between hover:bg-gray-600 transition-colors rounded-t-lg relative z-10"
        style={smallBorderStyle}
      >
        <h3 className="text-sm font-black" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{title}</h3>
        {expandedSections[id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expandedSections[id] && <div className={`px-2 pb-2 ${id === 'forms' ? '-mt-1' : 'pt-2'}`}>{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ 
      backgroundImage: 'url(/bg.png)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center center', 
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      position: 'relative',
      backgroundColor: 'linear-gradient(135deg, #166534 50%, #22c55e 50%)',
      padding: '1rem'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse 300px 150px at 15% 15%, rgba(255,255,255,0.4) 0%, transparent 50%),
          radial-gradient(ellipse 250px 125px at 85% 25%, rgba(255,255,255,0.25) 0%, transparent 60%),
          radial-gradient(ellipse 350px 175px at 50% 85%, rgba(255,255,255,0.08) 0%, transparent 70%),
          linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.6) 100%),
          rgba(0, 0, 0, 0)
        `,
        backdropFilter: 'blur(0.5px) saturate(140%)',
        WebkitBackdropFilter: 'blur(0.5px) saturate(140%)',
        boxShadow: `
          inset 0 4px 8px rgba(255,255,255,0.4),
          inset 0 -4px 8px rgba(0,0,0,0.5),
          inset -4px 0 8px rgba(0,0,0,0.3),
          inset 4px 0 8px rgba(255,255,255,0.25)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      <div className="max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="FS:R Builder" className="w-[150px] h-[150px]" />
        </div>

        <div className="bg-gray-800 bg-opacity-80 rounded-lg p-2 mb-4" style={borderStyle}>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setCurrentPage('builder')}
              className={`px-6 py-2 rounded font-black text-sm transition-colors ${
                currentPage === 'builder'
                  ? 'bg-green-600'
                  : 'hover:bg-gray-600'
              }`}
              style={{
                ...smallBorderStyle,
                background: currentPage === 'builder' 
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : `
                    repeating-radial-gradient(
                      circle at center,
                      rgba(30, 41, 59, 0.08) 0px,
                      transparent 10px,
                      transparent 20px,
                      rgba(30, 41, 59, 0.12) 30px
                    )
                  `,
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}
            >
              Builder
            </button>
            <button
              onClick={() => setCurrentPage('movekit')}
              className={`px-6 py-2 rounded font-black text-sm transition-colors ${
                currentPage === 'movekit'
                  ? 'bg-green-600'
                  : 'hover:bg-gray-600'
              }`}
              style={{
                ...smallBorderStyle,
                background: currentPage === 'movekit'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : `
                    repeating-radial-gradient(
                      circle at center,
                      rgba(30, 41, 59, 0.08) 0px,
                      transparent 10px,
                      transparent 20px,
                      rgba(30, 41, 59, 0.12) 30px
                    )
                  `,
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}
            >
              Skills
            </button>
            <button
              onClick={() => setCurrentPage('capsules')}
              className={`px-6 py-2 rounded font-black text-sm transition-colors ${
                currentPage === 'capsules'
                  ? 'bg-green-600'
                  : 'hover:bg-gray-600'
              }`}
              style={{
                ...smallBorderStyle,
                background: currentPage === 'capsules' 
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : `
                    repeating-radial-gradient(
                      circle at center,
                      rgba(30, 41, 59, 0.08) 0px,
                      transparent 10px,
                      transparent 20px,
                      rgba(30, 41, 59, 0.12) 30px
                    )
                  `,
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}
            >
              Capsules
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              className={`px-6 py-2 rounded font-black text-sm transition-colors ${
                currentPage === 'about'
                  ? 'bg-green-600'
                  : 'hover:bg-gray-600'
              }`}
              style={{
                ...smallBorderStyle,
                background: currentPage === 'about' 
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : `
                    repeating-radial-gradient(
                      circle at center,
                      rgba(30, 41, 59, 0.08) 0px,
                      transparent 10px,
                      transparent 20px,
                      rgba(30, 41, 59, 0.12) 30px
                    )
                  `,
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}
            >
              About
            </button>
          </div>
        </div>

        {currentPage === 'builder' && (
          <>
            <div className="bg-gray-800 bg-opacity-80 rounded-lg p-3 mb-3" style={borderStyle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black mb-1" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Race</label>
              <select
                value={selectedRace.name}
                onChange={(e) => {
                  setSelectedRace(sampleRaces.find(r => r.name === e.target.value));
                  setActiveForms([]);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-black transition-all duration-300"
                style={{ 
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  background: `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                    #374151
                  `,
                  backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                    #374151
                  `;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = `
                    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                    #374151
                  `;
                }}
              >
                {sampleRaces.map(race => (
                  <option key={race.name} value={race.name}>{race.name}</option>
                ))}
              </select>
            </div>

            {selectedRace.name === 'Alien' && (
              <div>
                <label className="block text-xs font-black mb-1" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Alien Subrace</label>
                <select
                  value={selectedAlienSubrace}
                  onChange={(e) => {
                    setSelectedAlienSubrace(e.target.value);
                    setActiveForms([]);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-black transition-all duration-300"
                  style={{ 
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                    background: `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      #374151
                    `,
                    backdropFilter: 'blur(4px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                      #374151
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      #374151
                    `;
                  }}
                >
                  {Object.keys(alienSubraces).map(subrace => (
                    <option key={subrace} value={subrace}>{subrace}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-black mb-1" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Level (0-305)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={level === 0 ? '' : level}
                  onBlur={(e) => setLevel(Math.min(305, Math.max(0, parseInt(e.target.value) || 0)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setLevel(Math.min(305, Math.max(0, parseInt(e.target.value) || 0)));
                      e.target.blur();
                    }
                  }}
                  placeholder="0"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-center font-bold text-xs focus:border-blue-500 focus:outline-none transition-all duration-300"
                  style={{ 
                    background: `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      #1f2937
                    `,
                    backdropFilter: 'blur(4px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                      #1f2937
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      #1f2937
                    `;
                  }}
                />
                <button
                  onClick={() => setLevel(305)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-black transition-colors"
                  style={{ textShadow: '1px 1px 0 #000' }}
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-2 mt-3" style={{ 
            ...smallBorderStyle,
            background: `
              repeating-radial-gradient(
                circle at center,
                rgba(0, 0, 0, 0.08) 0px,
                transparent 10px,
                transparent 20px,
                rgba(0, 0, 0, 0.12) 30px
              )
            `
          }}>
            <p className="text-xs font-black mb-2" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Level: {level} | Free Stat Points: {freePoints}</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-black transition-colors"
                style={{ 
                  ...smallBorderStyle,
                  textShadow: '1px 1px 0 #000'
                }}
              >
                Reset
              </button>
              <button
                onClick={handleExportBuild}
                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs font-black transition-colors"
                style={{ 
                  ...smallBorderStyle,
                  textShadow: '1px 1px 0 #000'
                }}
              >
                Export Build
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Section title="Extra Points" id="stats">
              <div className="rounded p-1.5 mb-2" style={{ 
                ...smallBorderStyle,
                background: `
                  repeating-radial-gradient(
                    circle at center,
                    rgba(0, 0, 0, 0.08) 0px,
                    transparent 10px,
                    transparent 20px,
                    rgba(0, 0, 0, 0.12) 30px
                  )
                `
              }}>
                <p className="text-xs font-black" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Available Points: {freePoints}</p>
              </div>
              <div className="space-y-1.5">
                {Object.entries(statNames).map(([key, label]) => (
                  <div key={key} className="rounded p-1.5" style={{ 
                    ...smallBorderStyle,
                    background: `
                      repeating-radial-gradient(
                        circle at center,
                        rgba(30, 41, 59, 0.08) 0px,
                        transparent 10px,
                        transparent 20px,
                        rgba(30, 41, 59, 0.12) 30px
                      )
                    `
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{label}</span>
                      <span className="text-xs font-black" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Base: {baseStats[key]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Manual:</span>
                      <input
                        key={`${key}-${manualStats[key]}`}
                        type="text"
                        defaultValue={manualStats[key] === 0 ? '' : manualStats[key]}
                        onBlur={(e) => handleStatInput(key, e.target.value)}
                        onKeyDown={(e) => {
                          if (!/[\d]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                            e.preventDefault();
                          }
                          if (e.key === 'Enter') {
                            handleStatInput(key, e.target.value);
                            e.target.blur();
                          }
                        }}
                        placeholder="0"
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-center font-bold text-xs focus:border-blue-500 focus:outline-none transition-all duration-300"
                        style={{ 
                          background: `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            #1f2937
                          `,
                          backdropFilter: 'blur(4px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                            #1f2937
                          `;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            #1f2937
                          `;
                        }}
                      />
                      <button
                        onClick={() => setManualStats(prev => ({ ...prev, [key]: 0 }))}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-xs font-black transition-colors"
                        style={{ textShadow: '1px 1px 0 #000' }}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleQuickMax(key)}
                        className="px-2 py-0.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-black transition-colors"
                        style={{ textShadow: '1px 1px 0 #000' }}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div>
            <Section title="Forms" id="forms">
              <style>{`
                .forms-scroll-container::-webkit-scrollbar {
                  width: 12px;
                }
                .forms-scroll-container::-webkit-scrollbar-track {
                  background: #1f2937;
                  border-radius: 4px;
                }
                .forms-scroll-container::-webkit-scrollbar-thumb {
                  background: #e5e7eb;
                  border-radius: 4px;
                }
                .forms-scroll-container::-webkit-scrollbar-thumb:hover {
                  background: #f3f4f6;
                }
              `}</style>
              <div 
                className="forms-scroll-container space-y-2 overflow-y-scroll pr-2" 
                style={{ 
                  maxHeight: '260px',
                  scrollbarWidth: 'auto',
                  scrollbarColor: '#e5e7eb #1f2937'
                }}
              >
                {(() => {
                  let formsToShow = selectedRace.forms;
                  
                  // If Tuffle is possessing, show possessed race forms
                  if (selectedRace.name === 'Tuffle' && possessionMode !== 'none') {
                    const possessedRace = sampleRaces.find(r => r.name === possessionMode);
                    formsToShow = possessedRace?.forms || [];
                  }
                  
                  // Filter Gigantification for Aliens - only Yardratian can use it
                  if (selectedRace.name === 'Alien' && selectedAlienSubrace !== 'Yardratian') {
                    formsToShow = formsToShow.filter(form => form.name !== 'Gigantification');
                  }
                  
                  return formsToShow.map(form => {
                  const activeForm = activeForms.find(f => f.form.name === form.name);
                  const mastery = activeForm?.mastery || 'normal';
                  
                  return (
                    <div key={form.name} className="rounded-lg p-2" style={{ 
                      ...smallBorderStyle,
                      background: 'linear-gradient(to right, #006720, #1dff97)'
                    }}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <img src={`/${form.icon}`} alt="" className="w-8 h-8 flex-shrink-0" />
                        <div>
                          <h4 className="font-black text-xs" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{form.name}</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1 mb-1.5">
                        {['normal', 'mastered', 'perfected'].map(m => (
                          <button
                            key={m}
                            onClick={() => toggleForm(form, m)}
                            className={`py-1.5 px-1 rounded text-xs font-black transition-colors ${
                              activeForm && mastery === m
                                ? 'text-white'
                                : 'hover:bg-gray-600'
                            }`}
                            style={{
                              ...smallBorderStyle,
                              background: activeForm && mastery === m
                                ? m === 'mastered'
                                  ? 'linear-gradient(135deg, #a0a0a0, #707070)'
                                  : m === 'perfected'
                                  ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                                  : 'linear-gradient(135deg, #10b981, #059669)'
                                : `
                                  repeating-radial-gradient(
                                    circle at center,
                                    rgba(30, 41, 59, 0.08) 0px,
                                    transparent 10px,
                                    transparent 20px,
                                    rgba(30, 41, 59, 0.12) 30px
                                  )
                                `,
                              textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                              color: 'white',
                              boxShadow: activeForm && mastery === m 
                                ? `${smallBorderStyle.boxShadow}, inset 0 1px 0 rgba(255,255,255,0.5)`
                                : smallBorderStyle.boxShadow
                            }}
                          >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </button>
                        ))}
                      </div>

                      {activeForm && (
                        <div className="bg-gray-800 bg-opacity-60 rounded p-1.5">
                          <p className="text-xs font-medium mb-1">Active Bonuses:</p>
                          <div className="grid grid-cols-2 gap-0.5 text-xs">
                            {Object.entries(form.getBonus(mastery)).map(([stat, value]) => {
                              const statType = form.statBonusTypes && form.statBonusTypes[stat] ? form.statBonusTypes[stat] : form.bonusType;
                              let displayValue;
                              
                              if (statType === 'multiplier') {
                                displayValue = `×${value.toFixed(2)}`;
                              } else {
                                displayValue = `+${value}`;
                              }
                              
                              return (
                                <div key={stat}>
                                  {statNames[stat]}: {displayValue}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  });
                })()}
              </div>
            </Section>

            {selectedRace.name === 'Majin' && (
              <Section title="Absorption" id="absorption">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-600 bg-opacity-70 rounded flex items-center justify-center z-50" style={{ backdropFilter: 'blur(2px)' }}>
                    <p className="text-2xl font-black text-gray-300" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>WIP</p>
                  </div>
                  <div className="space-y-2 opacity-40 pointer-events-none">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAbsorptionMode('none');
                        setSelectedNPC(null);
                        setPlayerAbsorptionLevel(1);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-black transition-colors ${
                        absorptionMode === 'none' ? 'bg-green-600' : 'hover:bg-gray-600'
                      }`}
                      style={{
                        ...smallBorderStyle,
                        background: absorptionMode === 'none'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : `
                            repeating-radial-gradient(
                              circle at center,
                              rgba(30, 41, 59, 0.08) 0px,
                              transparent 10px,
                              transparent 20px,
                              rgba(30, 41, 59, 0.12) 30px
                            )
                          `,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                      }}
                    >
                      None
                    </button>
                    <button
                      onClick={() => {
                        setAbsorptionMode('player');
                        setSelectedNPC(null);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-black transition-colors ${
                        absorptionMode === 'player' ? 'bg-green-600' : 'hover:bg-gray-600'
                      }`}
                      style={{
                        ...smallBorderStyle,
                        background: absorptionMode === 'player'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : `
                            repeating-radial-gradient(
                              circle at center,
                              rgba(30, 41, 59, 0.08) 0px,
                              transparent 10px,
                              transparent 20px,
                              rgba(30, 41, 59, 0.12) 30px
                            )
                          `,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                      }}
                    >
                      Player
                    </button>
                    <button
                      onClick={() => {
                        setAbsorptionMode('npc');
                        setPlayerAbsorptionLevel(1);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-black transition-colors ${
                        absorptionMode === 'npc' ? 'bg-green-600' : 'hover:bg-gray-600'
                      }`}
                      style={{
                        ...smallBorderStyle,
                        background: absorptionMode === 'npc'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : `
                            repeating-radial-gradient(
                              circle at center,
                              rgba(30, 41, 59, 0.08) 0px,
                              transparent 10px,
                              transparent 20px,
                              rgba(30, 41, 59, 0.12) 30px
                            )
                          `,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                      }}
                    >
                      NPC
                    </button>
                  </div>

                  {absorptionMode === 'player' && (
                    <div className="rounded p-2" style={{ 
                      ...smallBorderStyle,
                      background: `
                        repeating-radial-gradient(
                          circle at center,
                          rgba(30, 41, 59, 0.08) 0px,
                          transparent 10px,
                          transparent 20px,
                          rgba(30, 41, 59, 0.12) 30px
                        )
                      `
                    }}>
                      <label className="text-xs font-black block mb-1" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        Clone Stats from Level:
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          max="305"
                          value={playerAbsorptionLevel}
                          onChange={(e) => setPlayerAbsorptionLevel(Math.max(1, Math.min(305, parseInt(e.target.value) || 1)))}
                          className="flex-1 px-2 py-1.5 bg-gray-700 rounded text-xs text-white"
                          style={{ ...smallBorderStyle }}
                        />
                        <button
                          onClick={() => setPlayerAbsorptionLevel(305)}
                          className="px-2 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-black"
                          style={{ textShadow: '1px 1px 0 #000' }}
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  )}

                  {absorptionMode === 'npc' && (
                    <div className="rounded p-2" style={{ 
                      ...smallBorderStyle,
                      background: `
                        repeating-radial-gradient(
                          circle at center,
                          rgba(30, 41, 59, 0.08) 0px,
                          transparent 10px,
                          transparent 20px,
                          rgba(30, 41, 59, 0.12) 30px
                        )
                      `
                    }}>
                      <label className="text-xs font-black block mb-1" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        Select NPC:
                      </label>
                      <select
                        value={selectedNPC?.name || ''}
                        onChange={(e) => {
                          const npc = npcList.find(n => n.name === e.target.value);
                          setSelectedNPC(npc || null);
                        }}
                        className="w-full px-2 py-1.5 bg-gray-700 rounded text-xs text-white"
                        style={{ ...smallBorderStyle }}
                      >
                        <option value="">-- Choose NPC --</option>
                        {npcList.map(npc => (
                          <option key={npc.name} value={npc.name}>
                            {npc.name}
                          </option>
                        ))}
                      </select>
                      
                      {selectedNPC && (
                        <div className="mt-2 p-2 rounded bg-gray-800 bg-opacity-60">
                          <p className="text-xs font-black mb-1" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                            {selectedNPC.name} Stats:
                          </p>
                          <div className="text-xs grid grid-cols-2 gap-1">
                            {Object.entries(selectedNPC.stats).map(([stat, value]) => (
                              <div key={stat}>
                                <span className="font-black" style={{ color: '#ff9014' }}>{statNames[stat]}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(absorptionMode === 'player' || absorptionMode === 'npc') && Object.values(build.absorptionStats).some(v => v !== 0) && (
                    <div className="p-2 rounded bg-gray-800 bg-opacity-60">
                      <p className="text-xs font-black mb-1" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        Absorbed Stats Bonus:
                      </p>
                      <div className="text-xs grid grid-cols-2 gap-1">
                        {Object.entries(build.absorptionStats).map(([stat, value]) => (
                          value !== 0 && (
                            <div key={stat}>
                              <span className="font-black" style={{ color: '#ff9014' }}>{statNames[stat]}:</span> +{value}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </Section>
            )}

            {selectedRace.name === 'Tuffle' && (
              <Section title="Possession" id="possession">
                <div className="space-y-2">
                  <div className="rounded p-2" style={{ 
                    ...smallBorderStyle,
                    background: `
                      repeating-radial-gradient(
                        circle at center,
                        rgba(30, 41, 59, 0.08) 0px,
                        transparent 10px,
                        transparent 20px,
                        rgba(30, 41, 59, 0.12) 30px
                      )
                    `
                  }}>
                    <label className="block text-xs font-black mb-1" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                      Possess Race:
                    </label>
                    <select
                      value={possessionMode}
                      onChange={(e) => {
                        setPossessionMode(e.target.value);
                        setPossessedStatPoints({
                          meleeDamage: 0,
                          kiDamage: 0,
                          meleeResistance: 0,
                          kiResistance: 0,
                          speed: 0
                        });
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-black transition-all duration-300"
                      style={{ 
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                        background: `
                          linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                          #374151
                        `,
                        backdropFilter: 'blur(4px)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = `
                          linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                          #374151
                        `;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = `
                          linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                          #374151
                        `;
                      }}
                    >
                      <option value="none">-- No Possession --</option>
                      {sampleRaces.filter(r => r.name !== 'Tuffle' && r.name !== 'Majin').map(race => (
                        <option key={race.name} value={race.name}>{race.name}</option>
                      ))}
                    </select>
                  </div>

                  {possessionMode === 'Alien' && (
                    <div>
                      <label className="block text-xs font-black mb-1" style={{ color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Alien Subrace</label>
                      <select
                        value={selectedAlienSubrace}
                        onChange={(e) => {
                          setSelectedAlienSubrace(e.target.value);
                          setActiveForms([]);
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-black transition-all duration-300"
                        style={{ 
                          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                          background: `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            #374151
                          `,
                          backdropFilter: 'blur(4px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%),
                            #374151
                          `;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            #374151
                          `;
                        }}
                      >
                        {Object.keys(alienSubraces).map(subrace => (
                          <option key={subrace} value={subrace}>{subrace}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {possessionMode !== 'none' && (
                    <div className="rounded p-2 space-y-2" style={{ 
                      ...smallBorderStyle,
                      background: `
                        repeating-radial-gradient(
                          circle at center,
                          rgba(30, 41, 59, 0.08) 0px,
                          transparent 10px,
                          transparent 20px,
                          rgba(30, 41, 59, 0.12) 30px
                        )
                      `
                    }}>
                      <label className="text-xs font-black block" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                        Possessed Race Extra Stat Points:
                      </label>
                      {['meleeDamage', 'kiDamage', 'meleeResistance', 'kiResistance', 'speed'].map(stat => (
                        <div key={stat} className="flex items-center gap-2">
                          <label className="text-xs font-black flex-shrink-0" style={{ width: '120px', textShadow: '1px 1px 0 #000' }}>
                            {statNames[stat]}:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={possessedStatPoints[stat]}
                            onChange={(e) => setPossessedStatPoints(prev => ({
                              ...prev,
                              [stat]: Math.max(0, parseInt(e.target.value) || 0)
                            }))}
                            className="flex-1 px-2 py-1 bg-gray-700 rounded text-xs text-white"
                            style={{ ...smallBorderStyle }}
                          />
                          <button
                            onClick={() => setPossessedStatPoints(prev => ({
                              ...prev,
                              [stat]: 305
                            }))}
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-500 rounded text-xs font-black"
                            style={{ textShadow: '1px 1px 0 #000' }}
                          >
                            Max
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            <Section title="Final Stats" id="final">
              <div className="space-y-1.5">
                {Object.entries(statNames).map(([key, label]) => (
                  <div key={key} className="rounded p-3" style={{ ...smallBorderStyle, background: 'linear-gradient(to right, #006720, #1dff97)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black flex-shrink-0" style={{ color: '#ff9014', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' }}>{label}</span>
                      <span className="text-base font-black whitespace-nowrap" style={{ color: '#ff9014', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)' }}>{finalStats[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
        </>
        )}

        {currentPage === 'about' && (
          <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6" style={borderStyle}>
            <h2 className="text-2xl font-black mb-4" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>About</h2>
            <div className="space-y-4 text-gray-300">
              <p>Made by <span className="font-black text-white">edadosmal</span></p>
              <p>DM edadosmal on Discord for ideas and bugs/errors you find</p>
              <p className="text-center text-lg font-black" style={{ textShadow: '1px 1px 0 #000' }}>Thanks!!!</p>
            </div>
          </div>
        )}

        {currentPage === 'movekit' && (
          <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6" style={borderStyle}>
            <h2 className="text-2xl font-black mb-6 text-center" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>Select Moves</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((slotIndex) => {
                // Filter moves based on search and race access
                const filteredMoves = sampleMoves.filter(move => {
                  // First check search filter
                  const matchesSearch = move.name.toLowerCase().includes(moveSearches[slotIndex].toLowerCase()) ||
                    move.category.toLowerCase().includes(moveSearches[slotIndex].toLowerCase());
                  
                  if (!matchesSearch) return false;
                  
                  // If move has no race restrictions, allow it
                  if (!move.allowedRaces) return true;
                  
                  // Check if selected race can use this move
                  const raceName = selectedRace.name;
                  const subraceKey = selectedRace.name === 'Alien' ? `Alien:${selectedAlienSubrace}` : null;
                  
                  return move.allowedRaces.some(allowed => {
                    if (allowed === raceName) return true;
                    if (subraceKey && allowed === subraceKey) return true;
                    // For Alien, also check if just 'Alien' is in allowedRaces (meaning all alien subraces)
                    if (raceName === 'Alien' && allowed === 'Alien') return true;
                    return false;
                  });
                });
                const isOpen = openMoveSlot === slotIndex;
                return (
                <div key={slotIndex} className="relative">
                  <button
                    onClick={() => setOpenMoveSlot(isOpen ? null : slotIndex)}
                    className="w-full h-16 rounded-lg p-2 font-black text-xs cursor-pointer flex items-center justify-center text-center"
                    style={{
                      ...smallBorderStyle,
                      background: selectedMoves[slotIndex] 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #1f2937, #111827)',
                      color: '#fff',
                      textShadow: '1px 1px 0 #000'
                    }}
                  >
                    {selectedMoves[slotIndex] ? selectedMoves[slotIndex].name : `Slot ${slotIndex + 1}`}
                  </button>
                  
                  {isOpen && (
                    <div 
                      className="absolute top-full left-0 w-56 mt-1 rounded-lg z-50 max-h-72 overflow-hidden flex flex-col"
                      style={{
                        ...borderStyle,
                        background: 'linear-gradient(135deg, #1f2937, #111827)'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search moves..."
                        value={moveSearches[slotIndex]}
                        onChange={(e) => {
                          const newSearches = [...moveSearches];
                          newSearches[slotIndex] = e.target.value;
                          setMoveSearches(newSearches);
                        }}
                        className="w-full bg-gray-700 border-b border-gray-600 px-3 py-2 text-sm font-black focus:outline-none"
                        style={{ textShadow: '1px 1px 0 #000' }}
                        autoFocus
                      />
                      <div className="overflow-y-auto max-h-56">
                        <button
                          onClick={() => {
                            const newMoves = [...selectedMoves];
                            newMoves[slotIndex] = null;
                            setSelectedMoves(newMoves);
                            setOpenMoveSlot(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600 text-gray-400"
                        >
                          Clear Slot
                        </button>
                        {filteredMoves.map((move) => {
                          const idx = sampleMoves.indexOf(move);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                const newMoves = [...selectedMoves];
                                newMoves[slotIndex] = move;
                                setSelectedMoves(newMoves);
                                setOpenMoveSlot(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600 flex items-center gap-2"
                              style={{ textShadow: '1px 1px 0 #000' }}
                            >
                              <span className="text-xs px-1 rounded" style={{ 
                                background: move.category === 'Ki' ? '#ef4444' : 
                                           move.category === 'Melee' ? '#f59e0b' : 
                                           move.category === 'Other' ? '#6b7280' :
                                           move.category === 'Event' ? '#06b6d4' : '#a855f7',
                                fontSize: '10px'
                              }}>{move.category.charAt(0)}</span>
                              <span className="flex-1">{move.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* Click outside to close */}
            {openMoveSlot !== null && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setOpenMoveSlot(null)}
              />
            )}

            <div className="space-y-2">
              {selectedMoves.map((move, slotIndex) => (
                move && (
                  <div key={slotIndex} className="bg-gray-700 bg-opacity-60 rounded-lg p-3 flex items-center justify-between" style={smallBorderStyle}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-400">#{slotIndex + 1}</span>
                      <span className="font-black" style={{ textShadow: '1px 1px 0 #000' }}>{move.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded font-black" style={{ 
                        background: move.category === 'Ki' ? '#ef4444' : 
                                   move.category === 'Melee' ? '#f59e0b' : 
                                   move.category === 'Other' ? '#6b7280' :
                                   move.category === 'Event' ? '#06b6d4' : '#a855f7',
                        textShadow: '1px 1px 0 #000'
                      }}>{move.category}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {currentPage === 'capsules' && (
          <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6" style={borderStyle}>
            <h2 className="text-2xl font-black mb-6 text-center" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>Select Capsules</h2>

            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {[0, 1, 2, 3].map((slotIndex) => {
                const filteredCapsules = sampleCapsules.filter(capsule => 
                  capsule.name.toLowerCase().includes(capsuleSearches[slotIndex].toLowerCase()) ||
                  capsule.category.toLowerCase().includes(capsuleSearches[slotIndex].toLowerCase()) ||
                  capsule.description.toLowerCase().includes(capsuleSearches[slotIndex].toLowerCase())
                );
                const isOpen = openCapsuleSlot === slotIndex;
                return (
                <div key={slotIndex} className="w-40 relative">
                  <button
                    onClick={() => setOpenCapsuleSlot(isOpen ? null : slotIndex)}
                    className="w-full h-24 rounded-lg p-2 font-black text-sm cursor-pointer flex items-center justify-center text-center"
                    style={{
                      ...smallBorderStyle,
                      background: selectedCapsules[slotIndex] 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #1f2937, #111827)',
                      color: '#fff',
                      textShadow: '1px 1px 0 #000'
                    }}
                  >
                    {selectedCapsules[slotIndex] ? selectedCapsules[slotIndex].name : `Slot ${slotIndex + 1}`}
                  </button>
                  
                  {isOpen && (
                    <div 
                      className="absolute top-full left-0 w-64 mt-1 rounded-lg z-50 max-h-80 overflow-hidden flex flex-col"
                      style={{
                        ...borderStyle,
                        background: 'linear-gradient(135deg, #1f2937, #111827)'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search capsules..."
                        value={capsuleSearches[slotIndex]}
                        onChange={(e) => {
                          const newSearches = [...capsuleSearches];
                          newSearches[slotIndex] = e.target.value;
                          setCapsuleSearches(newSearches);
                        }}
                        className="w-full bg-gray-700 border-b border-gray-600 px-3 py-2 text-sm font-black focus:outline-none"
                        style={{ textShadow: '1px 1px 0 #000' }}
                        autoFocus
                      />
                      <div className="overflow-y-auto max-h-60">
                        <button
                          onClick={() => {
                            const newCapsules = [...selectedCapsules];
                            newCapsules[slotIndex] = null;
                            setSelectedCapsules(newCapsules);
                            setOpenCapsuleSlot(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600 text-gray-400"
                        >
                          Clear Slot
                        </button>
                        {filteredCapsules.map((capsule) => {
                          const idx = sampleCapsules.indexOf(capsule);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                const newCapsules = [...selectedCapsules];
                                newCapsules[slotIndex] = capsule;
                                setSelectedCapsules(newCapsules);
                                setOpenCapsuleSlot(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600 flex items-center gap-2"
                              style={{ textShadow: '1px 1px 0 #000' }}
                            >
                              <span className="text-xs px-1 rounded" style={{ 
                                background: capsule.category === 'Active' ? '#3b82f6' : 
                                           capsule.category === 'Passive' ? '#10b981' : 
                                           capsule.category === 'Raid/Dungeon' ? '#f59e0b' : '#a855f7',
                                fontSize: '10px'
                              }}>{capsule.category.charAt(0)}</span>
                              <span>{capsule.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* Click outside to close */}
            {openCapsuleSlot !== null && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setOpenCapsuleSlot(null)}
              />
            )}

            <div className="space-y-3">
              {selectedCapsules.map((capsule, slotIndex) => (
                capsule && (
                  <div key={slotIndex} className="bg-gray-700 bg-opacity-60 rounded-lg p-4" style={borderStyle}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-black" style={{ textShadow: '1px 1px 0 #000' }}>Slot {slotIndex + 1}: {capsule.name}</h3>
                      <span className="text-xs px-2 py-1 rounded font-black" style={{ 
                        background: capsule.category === 'Active' ? '#3b82f6' : 
                                   capsule.category === 'Passive' ? '#10b981' : 
                                   capsule.category === 'Raid/Dungeon' ? '#f59e0b' : '#a855f7',
                        textShadow: '1px 1px 0 #000'
                      }}>{capsule.category}</span>
                    </div>
                    <div className="space-y-3">
                      {capsule.description && (
                        <div className="p-3 rounded" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                          <p className="text-sm text-gray-300">{capsule.description}</p>
                        </div>
                      )}

                      <div className="p-3 rounded" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                        <p className="text-sm font-black mb-1">Affects Stats:</p>
                        <p className="text-base" style={{ color: capsule.affectsStats ? '#10b981' : '#ef4444' }}>
                          {capsule.affectsStats ? '✓ Yes' : '✗ No'}
                        </p>
                      </div>

                      {capsule.affectsStats && Object.keys(capsule.statBonuses).length > 0 && (
                        <div className="p-3 rounded" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                          <p className="text-sm font-black mb-2">Stat Bonuses:</p>
                          <div className="space-y-1.5">
                            {Object.entries(capsule.statBonuses).map(([stat, value]) => (
                              <div key={stat} className="text-xs flex justify-between items-center">
                                <span className="text-gray-300">{stat}:</span>
                                <span style={{ color: value >= 0 ? '#fbbf24' : '#ef4444' }} className="font-black">
                                  {value > 0 ? '+' : ''}{capsule.isPercentage[stat] ? (value * 100) + '%' : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterBuilder;