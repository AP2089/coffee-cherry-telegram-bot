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
    await ctx.api.editMessageText(
      ctx.chat!.id,
      thinking.message_id,
      'Ошибка AI. Попробуйте позже.',
      { reply_markup: backKb() },
    );
  }
}
