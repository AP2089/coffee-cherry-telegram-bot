import 'dotenv/config';
import { bot } from './bot.js';

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка бота (update ${ctx?.update?.update_id}):`, err.error);
});

async function startBot(attempt = 1): Promise<void> {
  try {
    await bot.start({
      onStart: () => console.log('coffee cherry bot запущен'),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Не удалось запустить бота (попытка ${attempt}):`, message);

    if (message.includes('409') || message.toLowerCase().includes('conflict')) {
      console.error(
        'Конфликт getUpdates: другой инстанс бота уже polling с этим BOT_TOKEN. ' +
          'Оставьте только один: development ИЛИ production.',
      );
    }

    const delay = Math.min(30_000, 3000 * attempt);
    await new Promise((r) => setTimeout(r, delay));
    return startBot(attempt + 1);
  }
}

void startBot();
