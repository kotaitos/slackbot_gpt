import 'dotenv/config'
import { App } from '@slack/bolt'
import { ask } from './ask';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    port: Number(process.env.PORT) || 3000
});

app.message(async ({ message, event, say }) => {
    // イベントがトリガーされたチャンネルに say() でメッセージを送信します
    if ('text' in event) {
        const text = event.text;
        const response = await ask(text)
        await say(`${response}`);
    }
  });

(async () => {
    // アプリを起動します
    await app.start(process.env.PORT || 3000);
  
    console.log('⚡️ Bolt app is running!');
})();
