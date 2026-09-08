import dns from 'node:dns';
import OpenAI from 'openai';
import { getCoffees, type Coffee } from './api.js';
import { fmt, formatCoffeeName, priceForWeight } from './helpers.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Node < 17
}

/** Актуальные alias-модели Google AI (старые gemini-2.0-flash / 1.5 уже 404). */
const MODELS = ['gemini-flash-latest', 'gemini-3.6-flash'] as const;

function createClient() {
  const apiKey = process.env.API_GEMINI_KEY?.trim();

  if (!apiKey) {
    throw new Error('API_GEMINI_KEY не задан');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
}

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

function errorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  return err.message;
}

export async function askAboutCoffee(question: string) {
  const gemini = createClient();
  const context = await shopContext();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
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
  ];

  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const res = await gemini.chat.completions.create({
        model,
        messages,
      });

      return res.choices[0]?.message?.content?.slice(0, 4000) ?? 'Нет ответа';
    } catch (err) {
      lastError = err;
      console.error(`AI model "${model}" failed:`, errorText(err));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Все модели Gemini недоступны');
}
