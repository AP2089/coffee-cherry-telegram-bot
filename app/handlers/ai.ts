import { Bot } from 'grammy';
import { askAboutCoffee } from '../gemini.js';
import { cancelKb, backKb, mdToHtml, HTML } from '../helpers.js';
import type { Ctx } from '../types/common.js';

export async function enterAiChat(ctx: Ctx) {
  ctx.session.step = 'ai:chat';
  await ctx.reply('🤖 Задайте вопрос про сорта coffee cherry:', { reply_markup: cancelKb() });
}

export function registerAi(bot: Bot<Ctx>) {
  bot.callbackQuery('ai', async (ctx) => {
    await ctx.answerCallbackQuery();
    await enterAiChat(ctx);
  });
}

export async function handleAiText(ctx: Ctx, text: string) {
  const thinking = await ctx.reply('⏳ Думаю…');
  await ctx.replyWithChatAction('typing');

  try {
    const answer = await askAboutCoffee(text);
    const html = mdToHtml(answer);

    try {
      await ctx.api.editMessageText(ctx.chat!.id, thinking.message_id, html, {
        ...HTML,
        reply_markup: backKb(),
      });
    } catch {
      await ctx.api.editMessageText(ctx.chat!.id, thinking.message_id, answer, {
        reply_markup: backKb(),
      });
    }
  } catch (err) {
    console.error('AI error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    let detail = 'Ошибка AI. Попробуйте позже.';

    if (msg.includes('API_GEMINI_KEY')) detail = 'Не задан API_GEMINI_KEY.';
    else if (msg.includes('User location is not supported'))
      detail =
        'Gemini недоступен с IP сервера (регион / IPv6). Нужен IPv4 из поддерживаемой страны или прокси.';

    await ctx.api.editMessageText(ctx.chat!.id, thinking.message_id, detail, {
      reply_markup: backKb(),
    });
  }
}
