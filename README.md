# Coffee Cherry Telegram Bot

## Демо

```bash
@coffee_cherry_bot
```

## Запуск

```bash
npm install
npm run dev
npm run build
npm run start
```

## Переменные окружения

| Переменная       | Описание                                        |
| ---------------- | ----------------------------------------------- |
| `BOT_TOKEN`      | Токен Telegram-бота                             |
| `API_URL`        | Базовый URL backend API                         |
| `API_GEMINI_KEY` | Ключ Google Gemini для AI-помощника             |
| `MINI_APP_URL`   | HTTPS URL mini-app (опционально, кнопка WebApp) |

## Scripts

- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- Husky + lint-staged — pre-commit
