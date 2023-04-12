import { Botkit } from "botkit";
import { SlackAdapter, SlackEventMiddleware } from "botbuilder-adapter-slack";

const adapter = new SlackAdapter({
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    botToken: process.env.BOT_TOKEN,
    redirectUri: ""
});

adapter.use(new SlackEventMiddleware());

const controller = new Botkit({
    adapter: adapter,
});

controller.on("app_mention", async (bot, message) => {
    await bot.reply(message, "I received an app_mention event.");
});
