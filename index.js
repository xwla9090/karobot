const TelegramBot = require("node-telegram-bot-api");
const http = require("http");
const TOKEN = "8603160426:AAGK2QbYXxQPnzDOEAhQ0PyB60MauoQ6RuU";
const URL = "https://karobot-production.up.railway.app";
const PORT = process.env.PORT || 8080;

const bot = new TelegramBot(TOKEN);
bot.setWebHook(URL + "/bot" + TOKEN);

const PROJECTS = {
  shasti: {label: "Shasti", password: "shasti123"},
  surosh: {label: "Surosh", password: "surosh123"}
};

const sessions = {};

bot.onText(/\/start/, function(msg) {
  var chatId = msg.chat.id;
  sessions[chatId] = {};
  var keyboard = Object.keys(PROJECTS).map(function(key) {
    return [{text: PROJECTS[key].label, callback_data: "project_" + key}];
  });
  bot.sendMessage(chatId, "Karo Group Bot\n\nSelect project:", {
    reply_markup: {inline_keyboard: keyboard}
  });
});

bot.on("callback_query", function(query) {
  var chatId = query.message.chat.id;
  var data = query.data;
  bot.answerCallbackQuery(query.id);

  if (data.indexOf("project_") === 0) {
    var project = data.replace("project_", "");
    sessions[chatId] = {project: project, step: "password"};
    bot.sendMessage(chatId, "Enter password for " + PROJECTS[project].label + ":");
  }

  if (data === "currency_iqd" || data === "currency_usd") {
    var s = sessions[chatId];
    if (!s) return;
    s.currency = data === "currency_iqd" ? "iqd" : "usd";
    s.step = "rate";
    bot.sendMessage(chatId, "Enter exchange rate (1$ = ? IQD):");
  }

  if (data === "deposit_yes" || data === "deposit_no") {
    var s2 = sessions[chatId];
    if (!s2) return;
    s2.withDeposit = data === "deposit_yes";
    bot.sendMessage(chatId, "Report ready!\nProject: " + PROJECTS[s2.project].label + "\nCurrency: " + s2.currency + "\nRate: " + s2.rate + "\nDeposit: " + (s2.withDeposit ? "Yes" : "No"));
  }
});

bot.on("message", function(msg) {
  var chatId = msg.chat.id;
  var text = msg.text;
  var s = sessions[chatId];
  if (!stext.indexOf("/") === 0) return;

  if (s.step === "password") {
    if (text === PROJECTS[s.project].password) {
      s.step = "menu";
      bot.sendMessage(chatId, "Welcome! Select currency:", {
        reply_markup: {inline_keyboard: [
          [{text: "IQD", callback_data: "currency_iqd"}],
          [{text: "USD", callback_data: "currency_usd"}]
        ]}
      });
    } else {
      bot.sendMessage(chatId, "Wrong password!");
    }
  }

  if (s.step === "rate") {
    var rate = Number(text);
    if (rate > 0) {
      s.rate = rate;
      s.step = "deposit";
      bot.sendMessage(chatId, "Include deposit?", {
        reply_markup: {inline_keyboard: [
          [{text: "With Deposit", callback_data: "deposit_yes"}],
          [{text: "Without Deposit", callback_data: "deposit_no"}]
        ]}
      });
    } else {
      bot.sendMessage(chatId, "Enter valid number:");
    }
  }
});

var server = http.createServer(function(req, res) {
  if (req.method === "POST" && req.url === "/bot" + TOKEN) {
    var body = "";
    req.on("data", function(chunk) { body += chunk; });
    req.on("end", function() {
      try {
        var update = JSON.parse(body);
        bot.processUpdate(update);
      } catch(e) {}
      res.writeHead(200);
      res.end("OK");
    });
  } else {
    res.writeHead(200);
    res.end("Karo Bot Running");
  }
});

server.listen(PORT, function() {
  console.log("Bot running on port " + PORT);
});