// State management
const STATE = {
  seconds: 0,
  isRunning: false,
  intervalId: null,
  data: [],
  startTimestamp: null,
 
};
 
// DOM Elements
const elements = {
  stopwatch: document.getElementById('stopwatch'),
  startPauseButton: document.getElementById('startPauseButton'),
  goalButton: document.getElementById('goalButton'),
  opgoalButton: document.getElementById('opgoalButton'),
  goalScorer: document.getElementById('goalScorer'),
  goalAssist: document.getElementById('goalAssist'),
  resetButton: document.getElementById('confirmResetBtn'),
  shareButton: document.getElementById('shareButton'),
  log: document.getElementById('log'),
  goalForm: document.getElementById('goalForm'),
  firstScoreElement: document.getElementById('first-score'),
  secondScoreElement: document.getElementById('second-score'),
  Team1NameElement: document.getElementById('first-team-name'),
  Team2NameElement: document.getElementById('second-team-name'),
  team1Input: document.getElementById('team1Name'),
  team2Input: document.getElementById('team2Name'),
  updTeam1Btn: document.getElementById('updTeam1Btn'),
  updTeam2Btn: document.getElementById('updTeam2Btn')
};

// Constants
const STORAGE_KEYS = {
  START_TIMESTAMP: 'goalTracker_startTimestamp',
  IS_RUNNING: 'goalTracker_isRunning',
  GOALS: 'goalTracker_goals',
  ELAPSED_TIME: 'goalTracker_elapsedTime',
  FIRST_SCORE: 'goalTracker_firstScore',    
  SECOND_SCORE: 'goalTracker_secondScore',
  TEAM1_NAME: 'goalTracker_team1name',    
  TEAM2_NAME: 'goalTracker_team2name'    
};

// Local Storage utilities
const Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  },
  
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading from localStorage:`, error);
      return defaultValue;
    }
  },
  
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

// Time formatting utility
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return [ minutes, secs]
    .map(num => num.toString().padStart(2, '0'))
    .join(':');
}

// Get current Seconds
function getCurrentSeconds() {
  if (!STATE.isRunning || !STATE.startTimestamp) return STATE.seconds;
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
  return elapsedSeconds;
}

//update stopwatch display
function updateStopwatchDisplay() {
  const currentSeconds = getCurrentSeconds();
  const existingTimeDisplay = startPauseButton.querySelector('#stopwatch');
    if (existingTimeDisplay) {
      existingTimeDisplay.textContent = formatTime(currentSeconds);
    }
  STATE.seconds = currentSeconds;
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, currentSeconds);
}

// Stopwatch controls
function startStopwatch() {
  if (!STATE.isRunning) {
    // Starting the timer
    STATE.isRunning = true;
    if (!STATE.startTimestamp) {
      STATE.startTimestamp = Date.now() - (STATE.seconds * 1000);
    }
    STATE.intervalId = setInterval(updateStopwatchDisplay, 100);
  
  //Change running style
  startPauseButton.classList.remove('btn-danger');
  startPauseButton.classList.add('btn-success');
  startPauseButton.textContent = 'Game in Progress';
  // Add text back
  const currentSeconds = getCurrentSeconds();
  const timeSpan = document.createElement('span');
  timeSpan.id = 'stopwatch';
  timeSpan.className = 'timer-badge';
  timeSpan.textContent = formatTime(currentSeconds);
  startPauseButton.appendChild(timeSpan);
  } else {
    //Change running style
    startPauseButton.classList.remove('btn-sucess');
    startPauseButton.classList.add('btn-danger');
    startPauseButton.textContent = 'Game is Paused';
    const currentSeconds = getCurrentSeconds();
    const timeSpan = document.createElement('span');
    timeSpan.id = 'stopwatch';
    timeSpan.className = 'timer-badge';
    timeSpan.textContent = formatTime(currentSeconds);
    startPauseButton.appendChild(timeSpan);
    // Pausing the timer
    clearInterval(STATE.intervalId);
    STATE.isRunning = false;
    STATE.seconds = getCurrentSeconds();
    STATE.startTimestamp = null;
  }
  // save state
  Storage.save(STORAGE_KEYS.IS_RUNNING, STATE.isRunning);
  Storage.save(STORAGE_KEYS.START_TIMESTAMP, STATE.startTimestamp);
  Storage.save(STORAGE_KEYS.ELAPSED_TIME, STATE.seconds);
}

// Add Team Goal
function addGoal(event) {
  event.preventDefault();
  
  const goalScorerName = elements.goalScorer.value;
  const goalAssistName = elements.goalAssist.value;
  const currentSeconds = getCurrentSeconds();
  
  const goalData = {
    timestamp: Math.ceil(currentSeconds / 60),
    goalScorerName,
    goalAssistName,
    rawTime: currentSeconds
  };
  
  //update log
  STATE.data.push(goalData);
  updateLog();
  
  // update scoreboard
   updateScoreBoard('first');
  
  //Save to storage
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
    
  // Reset form
  elements.goalForm.reset();
}
// Add Opposition Goal
function opaddGoal() {
  const currentSeconds = getCurrentSeconds();
  const team2Name = elements.Team2NameElement.textContent;
  const opgoalData = {
    timestamp: Math.ceil(currentSeconds / 60),
    goalScorerName: team2Name,
    goalAssistName: team2Name,
    rawTime: currentSeconds
  };
  
  //update log
  STATE.data.push(opgoalData);
  updateLog();

// update scoreboard
updateScoreBoard('second');

  //save to storage
  Storage.save(STORAGE_KEYS.GOALS, STATE.data);
  
    // Reset form
  elements.goalForm.reset();
}
// Update Goal Log
function updateLog() {
  elements.log.innerHTML = STATE.data
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(({ timestamp, goalScorerName, goalAssistName }) => {
      const team2Name = elements.Team2NameElement.textContent;
      const isOppositionGoal = goalScorerName === team2Name || goalScorerName === 'Opposition Team';
      const cardClass = isOppositionGoal ? 'border-danger border-2' : 'border-success border-2'; // adds colour border to log
      
      return `<div class="card mb-2 ${cardClass}">
        <div class="card-body p-2">
        <span>${timestamp}</span>' -  
        <strong>${isOppositionGoal ? `<font color="red"> ${team2Name} Goal</font>` : 'Goal:'}</strong>
        ${isOppositionGoal ? '' : ` ${goalScorerName}, <strong>Assist:</strong> ${goalAssistName}`}
       </div>
        </div>`;
    })
    .join('');
}

//Update Score Board Scores
function updateScoreBoard(scorecard) {
  if (scorecard === 'first') {
    const newScore = parseInt(elements.firstScoreElement.textContent) + 1;
    elements.firstScoreElement.textContent = newScore;
    Storage.save(STORAGE_KEYS.FIRST_SCORE, newScore);
  }
  if (scorecard === 'second') {
    const newScore = parseInt(elements.secondScoreElement.textContent) + 1;
    elements.secondScoreElement.textContent = newScore;
    Storage.save(STORAGE_KEYS.SECOND_SCORE, newScore);
  }
 }
//Update Score Board Teams
function updatefixtureTeams(team,teamName) {
  if (team === 'first') {
    elements.Team1NameElement.textContent = teamName;
    Storage.save(STORAGE_KEYS.TEAM1_NAME, teamName);
    // Update input placeholder
    const team1Input = document.getElementById('team1Name');
    if (team1Input) team1Input.placeholder = teamName;
  }
  if (team === 'second') {
    elements.Team2NameElement.textContent = teamName;
    Storage.save(STORAGE_KEYS.TEAM2_NAME, teamName);
    // Update input placeholder
    const team2Input = document.getElementById('team2Name');
    if (team2Input) team2Input.placeholder = teamName;
  }
}

// Reset the tracker
function resetTracker() {
  // Reset state
  clearInterval(STATE.intervalId);
  STATE.seconds = 0;
  STATE.isRunning = false;
  STATE.data = [];
  STATE.startTimestamp = null;
  
  // Reset UI
  updateStopwatchDisplay();
  updateLog();
  startPauseButton.classList.remove('btn-sucess');
  startPauseButton.classList.add('btn-danger');
  startPauseButton.textContent = 'Start Game';
  const timeSpan = document.createElement('span');
  timeSpan.id = 'stopwatch';
  timeSpan.className = 'timer-badge';
  timeSpan.textContent = "00:00";
  startPauseButton.appendChild(timeSpan);

  // Reset scoreboard
  elements.firstScoreElement.textContent = '0';
  elements.secondScoreElement.textContent = '0';

  // Clear storage
  Storage.clear();
  //redirect to main tab
  window.location.href = "index.html";
}

// Whatsapp Log Formatter
function formatLogForWhatsApp() {
  const gameTime = formatTime(STATE.seconds);
  const team1Name = elements.Team1NameElement.textContent;
  const team2Name = elements.Team2NameElement.textContent;
  const header = `⚽ Match Summary: ${team1Name} vs ${team2Name} (Time: ${gameTime})\n\n`;
  
  const goals = STATE.data
    .sort((a, b) => a.rawTime - b.rawTime)
    .map(({ timestamp, goalScorerName, goalAssistName }) => {
      const isOppositionGoal = goalScorerName === team2Name;
      return isOppositionGoal 
        ? `❌ ${timestamp} - ${team2Name} Goal`
        : `🥅 ${timestamp} - Goal: ${goalScorerName}, Assist: ${goalAssistName}`;
    })
    .join('\n');
    
  const stats = generateStats();
  return encodeURIComponent(`${header}${goals}\n\n${stats}`);
}
// Whatsapp statistics summary 
function generateStats() {
  const stats = new Map();
  // Count goals
  const goalScorers = new Map();
  const assists = new Map();
  let oppositionGoals = 0;  // Initialize opposition goals counter
  let teamGoals = 0;       // Initialize team goals counter
  
  STATE.data.forEach(({ goalScorerName, goalAssistName }) => {
   if (goalScorerName === "Opposition Team") {
      oppositionGoals++;
    } else {
		teamGoals++;
      goalScorers.set(goalScorerName, (goalScorers.get(goalScorerName) || 0) + 1);
      if (goalAssistName) {
        assists.set(goalAssistName, (assists.get(goalAssistName) || 0) + 1);
      }
    }
  });
  
  const topScorers = Array.from(goalScorers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, goals]) => `${name}: ${goals}`)
    .join(', ');
    
  const topAssists = Array.from(assists.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, assists]) => `${name}: ${assists}`)
    .join(', ');
  
  return `📊 Stats:\nTeam Goals: ${goalScorers.size > 0 ? Array.from(goalScorers.values()).reduce((a, b) => a + b) : 0}\nOpposition Goals: ${oppositionGoals}\nTop Scorers: ${topScorers}\nTop Assists: ${topAssists}`;
}
// Share to WhatsApp function
function shareToWhatsApp() {
  if (STATE.data.length === 0) {
    M.toast({html: 'No goals to share yet!'});
    return;
  }
  const formattedLog = formatLogForWhatsApp();
  const whatsappURL = `https://wa.me/?text=${formattedLog}`;
  window.open(whatsappURL, '_blank');
}

// include README.MD as release notes
function fetchReadme() {
  fetch('README.md')
      .then(response => response.text())
      .then(text => {
          // Simple markdown to HTML conversion for basic elements
          const html = text
          document.getElementById('readme').innerHTML = html;
      })
      .catch(error => {
          console.error('Error loading README:', error);
          document.getElementById('readme').innerHTML = 'Error loading README file.';
      });
}

// Initialize application
function initializeApp() {
	
  // Initialize roster
  RosterManager.init();
  let resetModal;
	
  // Load saved data
  STATE.isRunning = Storage.load(STORAGE_KEYS.IS_RUNNING, false);
  STATE.startTimestamp = Storage.load(STORAGE_KEYS.START_TIMESTAMP, null);
  STATE.seconds = Storage.load(STORAGE_KEYS.ELAPSED_TIME, 0);
  STATE.data = Storage.load(STORAGE_KEYS.GOALS, []);

  // Load saved scores
  const firstScore = Storage.load(STORAGE_KEYS.FIRST_SCORE, 0);
  const secondScore = Storage.load(STORAGE_KEYS.SECOND_SCORE, 0);
  elements.firstScoreElement.textContent = firstScore;
  elements.secondScoreElement.textContent = secondScore;

  // Load saved team names
  const team1Name = Storage.load(STORAGE_KEYS.TEAM1_NAME, 'Our Team');
  const team2Name = Storage.load(STORAGE_KEYS.TEAM2_NAME, 'Opposition Team');
  elements.Team1NameElement.textContent = team1Name;
  elements.Team2NameElement.textContent = team2Name;

  // Update input placeholders
  const team1Input = document.getElementById('team1Name');
  const team2Input = document.getElementById('team2Name');
  if (team1Input) team1Input.placeholder = team1Name;
  if (team2Input) team2Input.placeholder = team2Name;
  
  // If timer was running, calculate elapsed time and restart
  if (STATE.isRunning && STATE.startTimestamp) {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - STATE.startTimestamp) / 1000);
    STATE.seconds = elapsedSeconds;
    startStopwatch();
  }
 
  // Update UI with saved data
  updateStopwatchDisplay();
  updateLog();

}

// Event Listeners
elements.startPauseButton.addEventListener('click', startStopwatch);
elements.goalForm.addEventListener('submit', addGoal);
elements.opgoalButton.addEventListener('click', opaddGoal);
elements.resetButton.addEventListener('click', resetTracker);
elements.shareButton.addEventListener('click', shareToWhatsApp);
elements.shareButton.addEventListener('click', shareToWhatsApp);
elements.shareButton.addEventListener('click', shareToWhatsApp);
document.addEventListener('DOMContentLoaded', initializeApp);
document.addEventListener('DOMContentLoaded', fetchReadme);


  // Update Team 1 button click handler
  elements.updTeam1Btn.addEventListener('click', () => {
    const newTeamName = elements.team1Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('first', newTeamName);
      elements.team1Input.value = '';
    }
  });

  // Update Team 2 button click handler
  elements.updTeam2Btn.addEventListener('click', () => {
    const newTeamName = elements.team2Input.value.trim();
    if (newTeamName) {
      updatefixtureTeams('second', newTeamName);
      elements.team2Input.value = '';
    }
  });


// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && STATE.isRunning) {
    updateStopwatchDisplay();
  }
});
