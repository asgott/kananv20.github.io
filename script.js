document.addEventListener('DOMContentLoaded', () => {

  let pool = 5;
  let diff  = 6;

  const poolDisplay = document.getElementById('poolDisplay');
  const diffDisplay = document.getElementById('diffDisplay');
  const resultText  = document.getElementById('resultText');
  const diceTray    = document.getElementById('diceTray');

  document.querySelectorAll('.blood-cell').forEach(cell => {
  cell.addEventListener('click', () => {
    const filled = cell.getAttribute('data-filled') === '1';
    cell.setAttribute('data-filled', filled ? '0' : '1');
  });
});

document.getElementById('dodgeBtn').addEventListener('click', () => {
  triggerRoll(10, 6, 'Dodge');
});

document.getElementById('parryBtn').addEventListener('click', () => {
  triggerRoll(11, 6, 'Parry');
});

const WEAPONS = {
  swordcane: { atk: { pool: 8,  diff: 6 }, dmg: { pool: 8, diff: 6 } },
  dagger:    { atk: { pool: 8,  diff: 6 }, dmg: { pool: 7, diff: 6 } },
  deagle:    { atk: { pool: 7,  diff: 6 }, dmg: { pool: 5, diff: 6 } },
  bite: { atk: { pool: 7, diff: 5 }, dmg: { pool: 7, diff: 6 } },
};

// Stores bonus dice from the most recent attack roll, keyed by weapon
const bonusCache = {
  swordcane: 0,
  dagger:    0,
  deagle:    0,
  bite: 0,
};

function weaponAtk(id) {
  const wpn = WEAPONS[id];
  const penalty = getHealthPenalty();
  const effectivePool = Math.max(1, wpn.atk.pool - penalty);

  const rolls = [];
  for (let i = 0; i < effectivePool; i++) rolls.push(Math.floor(Math.random() * 10) + 1);

  let successes = 0;
  let ones = 0;
  const types = [];

  rolls.forEach(r => {
    if (r === 10)               { successes += 2; types.push('crit_success'); }
    else if (r >= wpn.atk.diff) { successes += 1; types.push('success');      }
    else if (r === 1)           { ones++;          types.push('crit_fail');    }
    else                        {                  types.push('failure');      }
  });

  successes = Math.max(0, successes - ones);
  const botch = successes === 0 && ones > 0;

  const bonus = successes > 1 ? successes - 1 : 0;
  bonusCache[id] = bonus;

  pool = effectivePool;
  diff = wpn.atk.diff;
  poolDisplay.textContent = pool;
  diffDisplay.textContent = diff;

  renderTray(rolls, types);

  const penaltyNote = penalty > 0 ? ` [-${penalty}]` : '';
  const label = `${id} ${bonus > 0 ? ` (+${bonus})` : ''}${penaltyNote}`;
  renderResult(successes, botch, label);
}

function weaponDmg(id) {
  const wpn = WEAPONS[id];
  const bonus = bonusCache[id];
  bonusCache[id] = 0;

  const penalty = getHealthPenalty();
  const totalPool = Math.max(1, wpn.dmg.pool + bonus - penalty);

  pool = totalPool;
  diff = wpn.dmg.diff;
  poolDisplay.textContent = pool;
  diffDisplay.textContent = diff;

  const penaltyNote = penalty > 0 ? ` [-${penalty} wound]` : '';
  const label = `${id} ${bonus > 0 ? ` (${wpn.dmg.pool} + ${bonus})` : ''}${penaltyNote}`;
  rollDice(totalPool, wpn.dmg.diff, label);
}

document.getElementById('swordcaneAtk').addEventListener('click', () => weaponAtk('swordcane'));
document.getElementById('swordcaneDmg').addEventListener('click', () => weaponDmg('swordcane'));

document.getElementById('daggerAtk').addEventListener('click', () => weaponAtk('dagger'));
document.getElementById('daggerDmg').addEventListener('click', () => weaponDmg('dagger'));

document.getElementById('deagleAtk').addEventListener('click', () => weaponAtk('deagle'));
document.getElementById('deagleDmg').addEventListener('click', () => weaponDmg('deagle'));

document.getElementById('biteAtk').addEventListener('click', () => weaponAtk('bite'));
document.getElementById('biteDmg').addEventListener('click', () => weaponDmg('bite'));



  document.getElementById('incPool').addEventListener('click', () => {
    if (pool < 20) { pool++; poolDisplay.textContent = pool; }
  });
  document.getElementById('decPool').addEventListener('click', () => {
    if (pool > 1)  { pool--; poolDisplay.textContent = pool; }
  });
  document.getElementById('incDiff').addEventListener('click', () => {
    if (diff < 10) { diff++; diffDisplay.textContent = diff; }
  });
  document.getElementById('decDiff').addEventListener('click', () => {
    if (diff > 2)  { diff--; diffDisplay.textContent = diff; }
  });

  document.getElementById('rollBtn').addEventListener('click', () => rollDice(pool, diff));

  window.triggerRoll = function(numDice, difficulty, label) {
    pool = numDice;
    diff = difficulty;
    poolDisplay.textContent = pool;
    diffDisplay.textContent = diff;
    rollDice(numDice, difficulty, label);
  };

  function rollDice(numDice, difficulty, label) {
  const penalty = getHealthPenalty();
  const effectivePool = Math.max(1, numDice - penalty);

  const rolls = [];
  for (let i = 0; i < effectivePool; i++) rolls.push(Math.floor(Math.random() * 10) + 1);

  let successes = 0;
  let ones      = 0;
  const types   = [];

  rolls.forEach(r => {
    if (r === 10)             { successes += 2; types.push('crit_success'); }
    else if (r >= difficulty) { successes += 1; types.push('success');      }
    else if (r === 1)         { ones++;          types.push('crit_fail');    }
    else                      {                  types.push('failure');      }
  });

  successes = Math.max(0, successes - ones);
  const botch = successes === 0 && ones > 0;

  renderTray(rolls, types);
  renderResult(successes, botch, label);
}

  function renderResult(successes, botch, label) {
    const prefix = label ? `${label}: ` : '';
    resultText.className = '';

    if (botch) {
      resultText.textContent = prefix + 'Botch!';
      resultText.className   = 'botch';
    } else if (successes === 0) {
      resultText.textContent = prefix + 'Failure';
      resultText.className   = 'failure';
    } else {
      resultText.textContent = prefix + successes + (successes === 1 ? ' success' : ' successes');
      resultText.className   = 'success';
    }
  }

  function renderTray(rolls, types) {
    diceTray.innerHTML = '';
    rolls.forEach((val, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'die-wrap';
      wrap.innerHTML = hexDie(val, types[i]);
      diceTray.appendChild(wrap);
    });
  }

  const DIE_COLORS = {
    crit_success: { fill: '#5b2d82', stroke: '#c084fc', text: '#f3e8ff' },
    success:      { fill: '#1a4a1a', stroke: '#4ade80', text: '#dcfce7' },
    failure:      { fill: '#3a3a3a', stroke: '#9ca3af', text: '#e5e7eb' },
    crit_fail:    { fill: '#4a1010', stroke: '#f87171', text: '#fee2e2' },
  };

  function hexDie(value, type) {
    const c = DIE_COLORS[type];
    const pts = '30,2 58,16 58,44 30,58 2,44 2,16';
    return `
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${pts}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.5"/>
        <text x="30" y="36" text-anchor="middle"
              font-size="20" font-weight="700"
              fill="${c.text}" font-family="'MedievalSharp', serif">${value}</text>
      </svg>`;
  }

  document.querySelectorAll('.health-box').forEach(box => {
    box.addEventListener('click', () => {
      const current = parseInt(box.getAttribute('data-state'));
      box.setAttribute('data-state', (current + 1) % 4);
    });
  });

 window.getHealthPenalty = function() {
  let highest = 0;
  document.querySelectorAll('.health-row').forEach(row => {
    const state = parseInt(row.querySelector('.health-box').getAttribute('data-state'));
    if (state > 0) {
      const penalty = parseInt(row.getAttribute('data-penalty'));
      if (penalty > highest) highest = penalty;
    }
  });
  return highest;
};

});
