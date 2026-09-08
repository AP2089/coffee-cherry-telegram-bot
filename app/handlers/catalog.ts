import { Bot, InlineKeyboard } from 'grammy';
import { getCoffees, getCoffeeBySlug, type CoffeeWeight } from '../api.js';
import { HTML, coffeeCard, formatCoffeeName, priceForWeight } from '../helpers.js';
import type { Ctx } from '../types/common.js';

export function registerCatalog(bot: Bot<Ctx>) {
  bot.callbackQuery('catalog', async (ctx) => {
    await ctx.answerCallbackQuery();
    const coffees = await getCoffees();
    const kb = new InlineKeyboard();

    coffees.forEach((c) =>
      kb.text(`${formatCoffeeName(c.name)} — ${c.country}`, `coffee:${c.slug}`).row(),
    );

    kb.text('← Назад', 'menu');

    await ctx.editMessageText('📋 <b>Каталог</b>\n\nВыберите сорт:', {
      ...HTML,
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^coffee:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const coffee = await getCoffeeBySlug(ctx.match[1]);

    if (!coffee) return ctx.editMessageText('Сорт не найден.');

    const kb = new InlineKeyboard();
    const weights = coffee.weights?.length ? coffee.weights : ([250, 500, 1000] as CoffeeWeight[]);

    if (coffee.stock > 0) {
      for (const w of weights) {
        kb.text(
          `${w} г — ${priceForWeight(coffee.price, w).toLocaleString('ru-RU')} ₽`,
          `add:${coffee.slug}:${w}`,
        ).row();
      }
    }

    kb.text('← К каталогу', 'catalog');
    await ctx.editMessageText(coffeeCard(coffee), { ...HTML, reply_markup: kb });
  });

  bot.callbackQuery(/^add:(.+):(\d+)$/, async (ctx) => {
    const slug = ctx.match[1];
    const weight = Number(ctx.match[2]) as CoffeeWeight;

    if (![250, 500, 1000].includes(weight)) {
      return ctx.answerCallbackQuery('Неверный вес');
    }

    const coffee = await getCoffeeBySlug(slug);

    if (!coffee || coffee.stock <= 0) return ctx.answerCallbackQuery('Нет в наличии');

    const price = priceForWeight(coffee.price, weight);
    const existing = ctx.session.cart.find((i) => i.slug === coffee.slug && i.weight === weight);

    if (existing) existing.quantity++;
    else
      ctx.session.cart.push({
        slug: coffee.slug,
        name: coffee.name,
        weight,
        quantity: 1,
        price,
        country: coffee.country,
      });

    await ctx.answerCallbackQuery('Добавлено в корзину ✅');
  });
}
