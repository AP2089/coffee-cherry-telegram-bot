import 'dotenv/config';
import { bot } from './bot.js';

bot.catch((err) => console.error('Ошибка бота:', err));

bot.start({ onStart: () => console.log('coffee cherry bot запущен') });
