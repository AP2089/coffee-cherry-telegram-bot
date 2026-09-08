import { Bot, session } from 'grammy';
import type { SessionData, Ctx } from './types/common.js';
import { HTML, mainKb } from './helpers.js';
import { registerCatalog } from './handlers/catalog.js';
import { registerCart, handleOrderText, submitOrder } from './handlers/cart.js';
import { registerContact, handleContactText } from './handlers/contact.js';
import { registerAi, handleAiText, enterAiChat } from './handlers/ai.js';

export const bot = new Bot<Ctx>(process.env.BOT_TOKEN!);

bot.use(
  session({
    initial: (): SessionData => ({
      step: null,
      cart: [],
      order: {},
      contact: {},
    }),
  }),
);

registerCatalog(bot);
registerCart(bot);
registerContact(bot);
registerAi(bot);

bot.command('start', async (ctx) => {
  if (ctx.match?.trim() === 'ai') {
    await enterAiChat(ctx);
    return;
  }

  ctx.session.step = null;
  await ctx.reply(
    'Добро пожаловать в <b>coffee cherry</b>\n\n5 сортов. 5 историй. Specialty-кофе.\n\nВыберите раздел:',
    {
      ...HTML,
      reply_markup: mainKb(),
    },
  );
});

bot.command('cancel', async (ctx) => {
  ctx.session.step = null;
  await ctx.reply('Отменено. Главное меню:', { reply_markup: mainKb() });
});

bot.command('skip', async (ctx) => {
  if (ctx.session.step === 'order:comment') {
    ctx.session.order.comment = '';
    await submitOrder(ctx);
  }
});

bot.callbackQuery('menu', async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = null;
  await ctx.editMessageText('Выберите раздел:', { reply_markup: mainKb() });
});

bot.callbackQuery('cancel', async (ctx) => {
  await ctx.answerCallbackQuery('Отменено');
  ctx.session.step = null;
  await ctx.reply('Главное меню:', { reply_markup: mainKb() });
});

bot.on('message:text', async (ctx) => {
  const { step } = ctx.session;

  if (!step || ctx.message.text.startsWith('/')) return;

  if (step.startsWith('order:')) await handleOrderText(ctx, ctx.message.text.trim());
  else if (step.startsWith('contact:')) await handleContactText(ctx, ctx.message.text.trim());
  else if (step === 'ai:chat') await handleAiText(ctx, ctx.message.text.trim());
});
