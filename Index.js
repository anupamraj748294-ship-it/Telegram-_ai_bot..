const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ---------- SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `
You are a helpful AI assistant like ChatGPT.
Reply in simple Hindi or Hinglish.
`;

// ---------- GEMINI ----------
async function askGemini(text) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: SYSTEM_PROMPT + "\nUser: " + text }] }]
    }
  );

  return res.data.candidates[0].content.parts[0].text;
}

// ---------- OPENAI ----------
async function askOpenAI(text) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );

  return res.data.choices[0].message.content;
}

// ---------- MAIN BOT ----------
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  bot.sendChatAction(chatId, "typing");

  try {
    // Step 1: Try Gemini first
    let reply = await askGemini(text);
    bot.sendMessage(chatId, reply);
  } catch (e) {
    try {
      // Step 2: fallback OpenAI
      let reply = await askOpenAI(text);
      bot.sendMessage(chatId, reply);
    } catch (err) {
      bot.sendMessage(chatId, "AI error आ गया 😢");
    }
  }
});
