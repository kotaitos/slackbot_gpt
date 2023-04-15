import 'dotenv/config'
import { App } from '@slack/bolt'
import { answer_with_websearch } from './websearch';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    port: Number(process.env.PORT) || 3000
});

let usingUser = new Set([]);

app.message(async ({ client, message, event, say }) => {
    // イベントがトリガーされたチャンネルに say() でメッセージを送信します
    if ('text' in event && 'user' in event) {
        const user = event.user;
        const text = event.text;
        try {
            if (event.user in usingUser) {
                await say(`<@${event.user}>さんの質問に対応中なのでお待ちください。`)
            } else {
                usingUser.add(event.user)
                const response = await answer_with_websearch(client, message, say, user, text)
                await say(`${response}`);
                usingUser.delete(event.user)
            }
        } catch (e) {
            console.log(e);
            await say(`エラーが発生しました。\nError: ${e}`)
        }
    }
  });

(async () => {
    // アプリを起動します
    await app.start(process.env.PORT || 3000);
  
    console.log('⚡️ Bolt app is running!');
})();
