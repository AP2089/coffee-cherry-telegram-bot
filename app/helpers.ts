import { InlineKeyboard } from 'grammy';
import type { CartItem, Coffee, CoffeeWeight } from './api.js';

export const WEIGHT_MULTIPLIER: Record<CoffeeWeight, number> = {
  250: 1,
  500: 1.9,
  1000: 3.6,
};

export const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ₽';
export const HTML = { parse_mode: 'HTML' as const };

export function priceForWeight(basePrice: number, weight: CoffeeWeight): number {
  return Math.round(basePrice * WEIGHT_MULTIPLIER[weight]);
}

export function formatCoffeeName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toLocaleUpperCase('ru-RU') + name.slice(1).toLocaleLowerCase('ru-RU');
}

/** Markdown → Telegram HTML */
export function mdToHtml(md: string): string {
  let text = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre>$1</pre>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  text = text.replace(/__(.+?)__/g, '<b>$1</b>');
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/^[-*]\s+/gm, '• ');

  return text;
}

export const mainKb = () => {
  const kb = new InlineKeyboard()
    .text('📋 Каталог', 'catalog')
    .text('🛒 Корзина', 'cart')
    .row()
    .text('📞 Контакты', 'contacts')
    .text('🤖 AI помощник', 'ai');

  const miniAppUrl = process.env.MINI_APP_URL?.trim();
  if (miniAppUrl) {
    kb.row().webApp('☕ Открыть приложение', miniAppUrl);
  }

  return kb;
};

export const backKb = () => new InlineKeyboard().text('← Главное меню', 'menu');

export const cancelKb = () => new InlineKeyboard().text('✕ Отмена', 'cancel');

export function coffeeCard(c: Coffee) {
  const name = formatCoffeeName(c.name);
  const notes = c.flavorNotes?.length ? c.flavorNotes.join(', ') : '—';
  const inStock = c.stock > 0;

  return [
    `<b>${name}</b>`,
    `<i>${c.country} · ${c.region}</i>`,
    '',
    c.description,
    '',
    `💰 от ${fmt(c.price)} / 250 г`,
    `🌱 ${c.process} · ${c.variety}`,
    `⛰ ${c.altitude}`,
    `✨ ${notes}`,
    inStock ? `✅ В наличии (${c.stock})` : '❌ Нет в наличии',
  ].join('\n');
}

export function cartText(cart: CartItem[]) {
  if (!cart.length) return '🛒 Корзина пуста';

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return [
    '🛒 <b>Ваша корзина:</b>',
    ...cart.map(
      (i) =>
        `• ${formatCoffeeName(i.name)} ${i.weight} г ×${i.quantity} — ${fmt(i.price * i.quantity)}`,
    ),
    '',
    `<b>Итого: ${fmt(total)}</b>`,
  ].join('\n');
}
