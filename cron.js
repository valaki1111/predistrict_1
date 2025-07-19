const { readJSON, writeJSON } = require('./db');
const { botAnswerQuestion } = require('./js/bots');
const fs = require('fs');
const path = require('path');

// Ez feltételezi, hogy a user adatokat is JSON-ben tárolod,
// pl. users.json, ha nincs adatbázis.
const usersFilePath = path.join(__dirname, 'users.json');

function runBotAnswers() {
  const leagues = readJSON('leagues.json') || [];
  const answers = readJSON('answers.json') || [];

  leagues.forEach(league => {
    const players = league.players || [];
    const humanPlayers = players.filter(p => !p.isBot);
    const botPlayersInLeague = players.filter(p => p.isBot);

    if (!league.questions) return;

    league.questions.forEach(question => {
      // Ellenőrizzük, hogy minden emberi játékos válaszolt-e már erre a kérdésre
      const allHumansAnswered = humanPlayers.every(player =>
        answers.find(a => a.leagueId === league.id && a.questionId === question.id && a.user === player.username)
      );

      if (!allHumansAnswered) {
        // Ha van emberi játékos, aki még nem válaszolt, akkor bot nem válaszol helyette
        return;
      }

      // Botok válaszolnak, ha még nem tették
      botPlayersInLeague.forEach(bot => {
        const alreadyAnsweredBot = answers.find(a => a.leagueId === league.id && a.questionId === question.id && a.user === bot.username);
        if (!alreadyAnsweredBot) {
          const answer = botAnswerQuestion(question);
          answers.push({
            leagueId: league.id,
            questionId: question.id,
            user: bot.username,
            option: answer,
            answeredAt: new Date().toISOString()
          });
        }
      });
    });
  });

  writeJSON('answers.json', answers);
}

// Új funkció: eltávolítja a ligából az 1 hét inaktív játékosokat
function removeInactivePlayersFromLeagues() {
  const leagues = readJSON('leagues.json') || [];
  const answers = readJSON('answers.json') || [];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  leagues.forEach(league => {
    // Csak az aktív játékosok maradjanak, akik legalább 1 héten belül válaszoltak valamelyik kérdésre ebben a ligában
    const activePlayers = league.players.filter(player => {
      if (player.isBot) return true; // botokat megtartjuk

      // Megnézzük, hogy a játékos mikor válaszolt utoljára ebben a ligában
      const lastAnswer = answers
        .filter(a => a.leagueId === league.id && a.user === player.username)
        .map(a => new Date(a.answeredAt))
        .sort((a, b) => b - a)[0]; // legfrissebb válasz

      if (!lastAnswer) return false; // soha nem válaszolt -> töröljük
      return lastAnswer >= oneWeekAgo;
    });

    league.players = activePlayers;
  });

  writeJSON('leagues.json', leagues);
}

function runCronJobs() {
  runBotAnswers();
  removeInactivePlayersFromLeagues();

  setInterval(() => {
    runBotAnswers();
    removeInactivePlayersFromLeagues();
  }, 1000 * 60 * 5); // 5 percenként fut
}

module.exports = { runCronJobs };
