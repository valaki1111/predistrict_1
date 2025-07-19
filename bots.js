const { readJSON, writeJSON } = require('../db');
// Ha használunk notifikációkat:
const { sendNotificationToAdmin } = require('./notifications');

const BOT_NAMES = [
  'BotAlpha',
  'QuizMasterBot',
  'SmartBot42',
  'AIChallenger',
  'PredictorBot'
];

function getRandomBotName(excludeNames = []) {
  const candidates = BOT_NAMES.filter(name => !excludeNames.includes(name));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function addBotsToLeague(league) {
  const currentPlayers = league.players || [];
  const existingNames = currentPlayers.map(p => p.name || p.username || '');

  const needed = 5 - currentPlayers.length;
  if (needed <= 0) return league;

  let newBots = [];
  for (let i = 0; i < needed; i++) {
    const botName = getRandomBotName([...existingNames, ...newBots.map(b => b.name)]);
    if (!botName) break;

    newBots.push({
      id: `bot_${Date.now()}_${i}`,
      name: botName,
      username: botName.toLowerCase(),
      isBot: true,
      points: 0
    });
  }

  league.players = [...currentPlayers, ...newBots];
  return league;
}

function botSubmitQuestions(league) {
  if (!league.settings?.botsCanSubmitQuestions) return;

  const submittedToday = (league.botQuestionsSubmitted || []).filter(d => {
    const day = new Date(d).toISOString().slice(0, 10);
    return day === new Date().toISOString().slice(0, 10);
  });

  if (submittedToday.length >= 1) return;

  const newQuestion = {
    id: `botq_${Date.now()}`,
    leagueId: league.id,
    question: `Will BotAlpha win the league this season?`,
    options: ['Yes', 'No'],
    category: 'Sports',
    createdBy: 'BotAlpha',
    createdAt: new Date().toISOString(),
    approved: false
  };

  league.pendingQuestions = league.pendingQuestions || [];
  league.pendingQuestions.push(newQuestion);

  league.botQuestionsSubmitted = [...(league.botQuestionsSubmitted || []), new Date().toISOString()];

  // Opcióként értesítés az adminnak
  if (typeof sendNotificationToAdmin === 'function') {
    sendNotificationToAdmin(`New bot question submitted in league ${league.id}: ${newQuestion.question}`);
  }
}

function startBots() {
  let leagues = readJSON('leagues.json') || [];

  leagues = leagues.map(league => {
    league = addBotsToLeague(league);
    botSubmitQuestions(league);
    return league;
  });

  writeJSON('leagues.json', leagues);
}

module.exports = {
  startBots,
  addBotsToLeague,
  botSubmitQuestions
};
