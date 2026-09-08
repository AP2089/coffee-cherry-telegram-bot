import { Bot, InlineKeyboard } from 'grammy';
import { createOrder } from '../api.js';
import { fmt, HTML, backKb, cancelKb, cartText } from '../helpers.js';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateCity,
  validateAddress,
  formatPhone,
} from '../validators.js';
import type { Ctx } from '../types/common.js';

export function registerCart(bot: Bot<Ctx>) {
  bot.callbackQuery('cart', async (ctx) => {
    await ctx.answerCallbackQuery();
    const { cart } = ctx.session;
    const kb = new InlineKeyboard();

    if (cart.length)
      kb.text('✅ Оформить заказ', 'checkout').row().text('🗑 Очистить корзину', 'cart:clear').row();

    kb.text('← Назад', 'menu');

    try {
      await ctx.editMessageText(cartText(cart), { ...HTML, reply_markup: kb });
    } catch {
      /* содержимое не изменилось */
    }
  });

  bot.callbackQuery('cart:clear', async (ctx) => {
    await ctx.answerCallbackQuery('Корзина очищена');
    ctx.session.cart = [];
    await ctx.editMessageText('🗑 Корзина очищена', { reply_markup: backKb() });
  });

  bot.callbackQuery('checkout', async (ctx) => {
    await ctx.answerCallbackQuery();

    if (!ctx.session.cart.length) return ctx.answerCallbackQuery('Корзина пуста');

    ctx.session.step = 'order:name';
    ctx.session.order = {};

    await ctx.reply('📝 <b>Оформление заказа</b>\n\nШаг 1/6 — Введите ваше имя:', {
      ...HTML,
      reply_markup: cancelKb(),
    });
  });
}

export async function handleOrderText(ctx: Ctx, text: string) {
  const { order } = ctx.session;

  switch (ctx.session.step) {
    case 'order:name': {
      const err = validateName(text);
      if (err) return ctx.reply(err);

      order.name = text.trim();
      ctx.session.step = 'order:email';
      return ctx.reply('Шаг 2/6 — Введите email:');
    }

    case 'order:email': {
      const err = validateEmail(text);
      if (err) return ctx.reply(err);

      order.email = text.trim();
      ctx.session.step = 'order:phone';
      return ctx.reply('Шаг 3/6 — Введите номер телефона:');
    }

    case 'order:phone': {
      const err = validatePhone(text);
      if (err) return ctx.reply(err);

      order.phone = formatPhone(text)!;
      ctx.session.step = 'order:city';
      return ctx.reply('Шаг 4/6 — Введите город:');
    }

    case 'order:city': {
      const err = validateCity(text);
      if (err) return ctx.reply(err);

      order.city = text.trim();
      ctx.session.step = 'order:address';
      return ctx.reply('Шаг 5/6 — Введите адрес доставки:');
    }

    case 'order:address': {
      const err = validateAddress(text);
      if (err) return ctx.reply(err);

      order.address = text.trim();
      ctx.session.step = 'order:comment';
      return ctx.reply('Шаг 6/6 — Комментарий к заказу (необязательно, или /skip):');
    }

    case 'order:comment':
      order.comment = text.trim();
      await submitOrder(ctx);
  }
}

export async function submitOrder(ctx: Ctx) {
  const { cart, order } = ctx.session;
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  try {
    const created = await createOrder({
      items: cart.map((i) => ({
        slug: i.slug,
        weight: i.weight,
        quantity: i.quantity,
      })),
      customer: {
        name: order.name!,
        email: order.email!,
        phone: order.phone!,
        city: order.city!,
        address: order.address!,
        comment: order.comment ?? '',
      },
    });

    ctx.session.cart = [];
    ctx.session.step = null;
    ctx.session.order = {};

    const orderId = created._id;
    const sum = created.totalPrice ?? total;

    await ctx.reply(
      `✅ <b>Заказ оформлен!</b>\n\nНомер: <code>${orderId}</code>\nСумма: <b>${fmt(sum)}</b>\n\nМы свяжемся с вами в ближайшее время.`,
      { ...HTML, reply_markup: backKb() },
    );
  } catch (err) {
    console.error('Order error:', err);
    ctx.session.step = null;
    await ctx.reply('Ошибка при оформлении заказа. Попробуйте позже.', {
      reply_markup: backKb(),
    });
  }
}
