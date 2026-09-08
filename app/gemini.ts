import OpenAI from 'openai';
import { getCoffees, type Coffee } from './api.js';
import { fmt, formatCoffeeName, priceForWeight } from './helpers.js';

const gemini = new OpenAI({
  apiKey: process.env.API_GEMINI_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

function catalogText(coffees: Coffee[]) {
  if (!coffees.length) return 'Каталог пуст или недоступен.';

  return coffees
    .map((c) => {
      const prices = (c.weights?.length ? c.weights : ([250, 500, 1000] as const))
        .map((w) => `${w} г: ${fmt(priceForWeight(c.price, w))}`)
        .join(', ');

      return [
        `• ${formatCoffeeName(c.name)} (${c.slug})`,
        `  ${c.country}, ${c.region}`,
        `  Обработка: ${c.process} | Сорт: ${c.variety} | Высота: ${c.altitude}`,
        `  Цены: ${prices}`,
        `  Остаток: ${c.stock}`,
        `  Вкус: ${c.flavorNotes?.join(', ') || '—'}`,
        `  Описание: ${c.description}`,
      ].join('\n');
    })
    .join('\n\n');
}

async function shopContext() {
  const coffees = await getCoffees().catch(() => [] as Coffee[]);

  return [
    'Каталог specialty-кофе:',
    catalogText(coffees),
    '',
    'Доставка и заказ:',
    '• Оформить заказ можно в боте (Корзина) или в Telegram Mini App',
    '• Веса фасовки: 250 г, 500 г, 1000 г',
    '• Цена в каталоге указана за 250 г; 500 г ×1.9, 1000 г ×3.6',
    '• Обратная связь: раздел Контакты в боте',
    '• Бренд: coffee cherry — 5 сортов specialty-кофе',
  ].join('\n');
}

export async function askAboutCoffee(question: string) {
  const context = await shopContext();

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.0-flash',
    messages: [
      {
        role: 'system',
        content: [
          'Ты помощник магазина coffee cherry (specialty-кофе).',
          'Отвечай на вопросы о магазине, сортах, вкусах, ценах, фасовке, доставке и контактах.',
          'Если вопрос не связан с кофе или магазином — вежливо откажи.',
          'Используй только данные ниже. Не выдумывай цены, сорта и контакты.',
          'Отвечай кратко на русском. Markdown: **жирный**, *курсив*, списки через - .',
          '',
          context,
        ].join('\n'),
      },
      { role: 'user', content: question },
    ],
  });

  return res.choices[0]?.message?.content?.slice(0, 4000) ?? 'Нет ответа';
}
