# Development Log — СравниАвто

### 2026-02-21 - Исправление загрузки и ошибки 502 на проде

#### Что сделано
- **Loading.tsx**: Заменена циклическая анимация на асимптотический прогресс (0%→95%), добавлен отображаемый процент
- **llm.py**: Добавлен скоринг авто по приоритетам/целям пользователя, лимит 10 машин для LLM (было 27-37)
- **llm.py**: Сокращён системный промпт (3 рекомендации вместо 5, лаконичные ответы)
- **llm.py**: Добавлен retry (до 2 попыток) при обрезанном JSON + проверка finish_reason
- **client.ts**: Добавлен автоматический retry при "Load failed" / "Failed to fetch" (мобильные браузеры)
- Время ответа: 65с → 21с (вписывается в таймаут Telegram in-app browser)

#### Изменённые файлы
- `frontend/src/components/Loading.tsx` — линейный прогресс с процентом
- `frontend/src/api/client.ts` — retry при сетевых ошибках
- `backend/llm.py` — скоринг, лимит машин, лаконичный промпт, retry

#### Тестирование
- [x] Python syntax check
- [x] TypeScript build
- [x] Тест на проде: 3 рекомендации за 21с
- [ ] Визуальная проверка загрузки в Telegram-браузере

#### Статус
✅ Завершено — задеплоено на прод

### 2026-02-21 - Инициализация проекта и параллельная сборка

#### Что сделано
- Создана структура проекта: backend/, frontend/, parser/, deploy/
- Заполнена база автомобилей `cars_database.json` — 44 модели (LADA, Haval, Chery, Geely, Changan, Exeed, Omoda, Jaecoo, Jetour, Tank, Belgee + б/у иномарки)
- Создан пустой `reviews_database.json` (будет заполнен парсером)
- Запущена параллельная сборка: Backend (FastAPI), Frontend (React+TS+Tailwind), Parser (Drom.ru)
- Созданы deploy-конфиги: nginx.conf, car-advisor.service

#### Изменённые файлы
- `backend/data/cars_database.json` — 44 модели авто с характеристиками
- `backend/data/reviews_database.json` — пустая заглушка
- `deploy/nginx.conf` — конфиг Nginx для фронта и API
- `deploy/car-advisor.service` — systemd сервис для бэкенда

#### Тестирование
- [ ] Backend API endpoints
- [ ] Frontend компиляция и рендеринг
- [ ] Parser парсинг Drom.ru
- [ ] End-to-end тест

#### Статус
⏳ В процессе — агенты собирают backend, frontend, parser

### 2026-02-21 - FastAPI Backend создан

#### Что сделано
- Создан `backend/requirements.txt` с зависимостями (FastAPI, uvicorn, anthropic, httpx, pydantic, python-dotenv)
- Создан `backend/models.py` — все Pydantic модели: QuizAnswers, CarRecommendation, RecommendResponse, ChatRequest/ChatResponse, StatsResponse, вспомогательные ProConItem и OwnerQuote
- Создан `backend/llm.py` — интеграция с Claude API:
  - Pre-filter функция (бюджет, новый/б.у., пассажиры, китайские бренды)
  - Построение промпта с анкетой пользователя + данные авто + отзывы
  - Async вызов Claude (claude-sonnet-4-6) с JSON-форматом ответа
  - Системный промпт на русском языке (автоэксперт)
  - Парсинг и валидация JSON-ответа
  - Функция chat_followup для уточняющих вопросов
- Создан `backend/main.py` — FastAPI приложение:
  - CORS для car.create-products.com и localhost:5173
  - Загрузка cars_database.json и reviews_database.json на старте (lifespan)
  - POST /api/recommend — рекомендации по анкете
  - POST /api/chat — follow-up чат
  - GET /api/stats — статистика базы
  - GET /api/health — проверка здоровья
  - Обработка ошибок с русскоязычными сообщениями

#### Изменённые файлы
- `backend/requirements.txt` — новый файл
- `backend/models.py` — новый файл
- `backend/llm.py` — новый файл
- `backend/main.py` — новый файл

#### Тестирование
- [ ] Синтаксис Python (AST parse)
- [ ] Запуск сервера с uvicorn
- [ ] POST /api/recommend с тестовой анкетой
- [ ] GET /api/health и /api/stats

#### Статус
⏳ В процессе — код написан, требует тестирования с реальным API ключом

### 2026-02-21 - React + TypeScript + Tailwind CSS Frontend создан

#### Что сделано
- Создан полный фронтенд на React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- Конфигурация проекта: package.json, tsconfig.json, vite.config.ts с @tailwindcss/vite плагином
- TypeScript типы (src/types/index.ts) — полностью совпадают с backend Pydantic моделями
- Данные квиза (src/data/questions.ts) — 7 вопросов на русском языке
- API клиент (src/api/client.ts) — getRecommendations, sendChatMessage, getStats
- Хук useQuiz (src/hooks/useQuiz.ts) — управление состоянием квиза с валидацией
- Компоненты:
  - Landing.tsx — лендинг с CTA, фичами и "как это работает"
  - Quiz.tsx — контейнер квиза с прогресс-баром и навигацией
  - QuizQuestion.tsx — рендерер вопросов (budget slider, multi-select, single-select, ranking)
  - Loading.tsx — экран загрузки с анимациями и статистикой
  - Results.tsx — страница результатов со списком карточек
  - CarCard.tsx — карточка рекомендации с match%, плюсами/минусами, цитатой, ссылками
  - ProConItem.tsx — строка плюса/минуса с бейджем владельцев
  - OwnerQuote.tsx — блок цитаты владельца с синей рамкой
  - ReviewBadge.tsx — бейдж с количеством отзывов
  - Chat.tsx — чат для уточняющих вопросов (плавающая кнопка + панель)
  - App.tsx — главный компонент с state-based routing
- Дизайн-система: accent #4361ee, pros #06d6a0, cons #ef476f, Inter font, mobile-first
- Все тексты на русском языке

#### Изменённые файлы
- `frontend/package.json` — конфигурация npm проекта
- `frontend/index.html` — HTML с Inter font из Google Fonts
- `frontend/vite.config.ts` — Vite + React + Tailwind plugins
- `frontend/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript конфиг
- `frontend/eslint.config.js` — ESLint конфигурация
- `frontend/src/index.css` — Tailwind import + кастомные стили
- `frontend/src/main.tsx` — точка входа
- `frontend/src/App.tsx` — главный компонент
- `frontend/src/types/index.ts` — TypeScript типы
- `frontend/src/data/questions.ts` — вопросы квиза
- `frontend/src/api/client.ts` — API клиент
- `frontend/src/hooks/useQuiz.ts` — хук квиза
- `frontend/src/components/*.tsx` — 11 компонентов UI

#### Тестирование
- [ ] npm install (установка зависимостей)
- [ ] npm run dev (запуск dev-сервера)
- [ ] npm run build (TypeScript компиляция + Vite сборка)
- [ ] Ручное тестирование всех экранов в браузере

#### Следующий шаг
Выполнить `cd frontend && npm install && npm run dev` для установки зависимостей и запуска

#### Статус
⏳ В процессе — все файлы созданы, требуется npm install и тестирование

### 2026-02-21 - Parser: парсер отзывов с Drom.ru

#### Что сделано
- Создан полный парсер отзывов с Drom.ru для сбора и агрегации отзывов владельцев
- `parser/requirements.txt` — зависимости: requests, beautifulsoup4, lxml, anthropic, python-dotenv
- `parser/config.py` — конфигурация: пути к БД, задержки, User-Agent ротация, параметры Claude API
- `parser/sources/base.py` — абстрактный базовый класс BaseReviewParser + датакласс RawReview:
  - Общая логика HTTP-запросов с ретраями, rate limiting, ротацией User-Agent
  - fetch_reviews() — пагинация списка + парсинг отдельных отзывов
- `parser/sources/drom.py` — DromParser(BaseReviewParser):
  - URL: https://www.drom.ru/reviews/{brand}/{model}/
  - Множественные стратегии извлечения: рейтинг, плюсы, минусы, текст, опыт, год, дата, категории
  - Поиск по CSS-селекторам, meta-тегам, regex по тексту, structured data
  - Устойчивость к отсутствующим полям (graceful degradation)
- `parser/sources/autoru.py` — AutoruParser (заглушка, Auto.ru — SPA, требует Playwright)
- `parser/aggregator.py` — две стратегии агрегации:
  - aggregate_via_llm() — через Claude API: группировка, подсчёт, топ-5 плюсов/минусов, цитаты
  - aggregate_via_fuzzy() — fallback через SequenceMatcher: группировка похожих текстов
- `parser/reviews_parser.py` — главный оркестратор:
  - CLI: --model, --force, --no-llm, --verbose, --max-reviews
  - Проверка свежести (skip если < 7 дней)
  - Промежуточное сохранение после каждой модели
  - Логирование в parser/logs/parser.log + stdout
  - Сводка: "Обновлено N моделей, добавлено M новых отзывов"

#### Изменённые файлы
- `parser/requirements.txt` — новый файл
- `parser/__init__.py` — новый файл
- `parser/config.py` — новый файл
- `parser/sources/__init__.py` — новый файл
- `parser/sources/base.py` — новый файл
- `parser/sources/drom.py` — новый файл
- `parser/sources/autoru.py` — новый файл
- `parser/aggregator.py` — новый файл
- `parser/reviews_parser.py` — новый файл

#### Тестирование
- [ ] pip install -r parser/requirements.txt
- [ ] python -m parser.reviews_parser --model lada_granta --no-llm --max-reviews 3
- [ ] Проверка reviews_database.json после запуска
- [ ] Тест с LLM агрегацией (требует ANTHROPIC_API_KEY)

#### Следующий шаг
- Установить зависимости: `pip install -r parser/requirements.txt`
- Тестовый запуск: `python -m parser.reviews_parser --model lada_granta --no-llm --max-reviews 3 -v`
- Настроить cron на VPS для еженедельного запуска

#### Статус
⏳ В процессе — код написан, требует тестирования

### 2026-02-21 - Полное тестирование + переход на OpenRouter API

#### Что сделано
- Проведена полная проверка всех компонентов проекта
- Frontend: `npm run build` успешно (42 модуля, 223KB JS + 24KB CSS), dev-сервер работает
- Backend: все Python файлы проходят AST-парсинг, все зависимости установлены
- Parser: все файлы валидны, зависимости установлены
- Проверено совпадение TypeScript типов и Pydantic моделей — полное соответствие
- **Переход с Anthropic SDK на OpenRouter API:**
  - Заменён `anthropic` на `openai` SDK в requirements.txt
  - Переписан `llm.py`: AsyncAnthropic → AsyncOpenAI с base_url OpenRouter
  - Модель: `anthropic/claude-sonnet-4-6` через OpenRouter
  - Создан `backend/.env` с OPENROUTER_API_KEY и OPENROUTER_MODEL
  - Создан `backend/run.py` — launcher для корректной загрузки .env
  - Обновлён `main.py`: ANTHROPIC_API_KEY → OPENROUTER_API_KEY
- **Полный тест /api/recommend** — 5 рекомендаций (Tiggo 7 Pro 88%, Atlas Pro 85%, CS55+ 80%, X70 76%, Jolion 72%)
- **Полный тест /api/chat** — контекстный ответ про зимнюю эксплуатацию
- Все 4 endpoint'а работают корректно

#### Изменённые файлы
- `backend/llm.py` — переписан для OpenRouter API
- `backend/main.py` — ANTHROPIC_API_KEY → OPENROUTER_API_KEY
- `backend/requirements.txt` — anthropic → openai
- `backend/.env` — создан с ключами OpenRouter
- `backend/run.py` — создан launcher скрипт

#### Тестирование
- [x] Frontend build + dev server
- [x] Backend: health, stats, recommend, chat — всё работает
- [x] Parser: синтаксис + зависимости

#### Следующий шаг
- Обновить `backend/.env.example` для OpenRouter формата
- E2E тест frontend + backend в браузере
- Деплой на VPS
- Запустить парсер отзывов

#### Статус
✅ Завершено — все API endpoints протестированы и работают

### 2026-02-21 - E2E тест пройден полностью

#### Что сделано
- Установлен Playwright для E2E тестирования
- Написан и выполнен полный E2E тест (e2e_test.mjs):
  - Landing page: заголовок, CTA кнопка, фичи — всё рендерится
  - Quiz: все 7 шагов работают (budget, purposes, passengers, priorities, experience, city, chinese)
  - Loading screen: анимация, "по 44 моделям"
  - Results: 5 карточек рекомендаций, match%, плюсы/минусы, кнопки Drom/Auto.ru
- 0 ошибок в консоли браузера
- 10 скриншотов сохранены в screenshots/
- Полный flow от Landing до Results работает корректно

#### Изменённые файлы
- `e2e_test.mjs` — создан E2E тест скрипт
- `screenshots/*.png` — 10 скриншотов тестирования

#### Тестирование
- [x] Landing page рендеринг
- [x] Quiz навигация (вперёд/назад)
- [x] Все типы вопросов (budget slider, multi-select, single-select, ranking)
- [x] Валидация шагов (кнопка disabled без ответа)
- [x] Loading screen
- [x] API вызов /api/recommend
- [x] Results с 5 карточками
- [x] Консоль без ошибок

#### Статус
✅ Завершено — E2E тест пройден на 100%

### 2026-02-21 - Деплой на VPS (car.create-products.com)

#### Что сделано
- Изменён `frontend/src/api/client.ts`: `||` → `??` для корректной работы с пустым VITE_API_URL (relative URLs)
- Обновлён `deploy/nginx.conf`: один server block с `/api/*` проксированием (вместо двух доменов)
- Обновлён `deploy/car-advisor.service`: порт 8001 (8000 занят другим проектом), bind 127.0.0.1, EnvironmentFile в backend/.env
- Собран frontend с `VITE_API_URL=""` → relative URLs `/api/*`
- Загружены файлы на VPS (45.80.69.205):
  - Backend: /opt/car-advisor/backend/ (main.py, models.py, llm.py, run.py, requirements.txt, data/)
  - Frontend: /var/www/car-advisor/ (собранный dist/)
  - Configs: nginx sites-available, systemd service
- Создан Python 3.12 venv, установлены зависимости pip
- Создан .env с OPENROUTER_API_KEY и OPENROUTER_MODEL
- Настроен SSL через certbot (сертификат до 2026-05-22, автообновление)
- Сервис car-advisor запущен (2 workers, enabled)

#### Архитектура
```
car.create-products.com (HTTPS)
        │
      nginx (80→301→443)
        ├── /api/*  → proxy_pass → uvicorn (127.0.0.1:8001)
        └── /*      → static files (/var/www/car-advisor/)
```

#### Изменённые файлы
- `frontend/src/api/client.ts` — `??` вместо `||` для VITE_API_URL
- `deploy/nginx.conf` — один домен, /api/* проксирование, порт 8001
- `deploy/car-advisor.service` — порт 8001, EnvironmentFile путь

#### Верификация
- [x] `curl https://car.create-products.com/api/health` → `{"status":"ok","cars_loaded":44,"api_key_set":true}`
- [x] `curl https://car.create-products.com/api/stats` → `{"total_cars":44}`
- [x] `curl https://car.create-products.com/` → HTTP 200, HTML с React app
- [x] HTTP → HTTPS редирект (301)
- [x] SSL сертификат Let's Encrypt валиден

#### Статус
✅ Завершено — сайт доступен по https://car.create-products.com

### 2026-02-21 - Редизайн фронтенда + UX: "Изменить запрос"

#### Что сделано
- Добавлена библиотека `lucide-react` — SVG-иконки заменили все эмодзи в интерфейсе
- Обновлена цветовая палитра: новые CSS-переменные (primary, success, danger, warning, neutrals)
- Добавлены градиенты на CTA-кнопки, хедеры, бейджи, чат
- Landing: иконка Car вместо 🚗, фичи в карточках с цветными иконками, фоновый градиент
- Quiz: сегментированный прогресс-бар (7 точек), вопросы в белой карточке, иконки навигации
- QuizQuestion: маппинг 25+ lucide-иконок по значениям опций, pill-кнопки для "Новые/С пробегом", чекмарки, radio-индикаторы
- Loading: иконки стадий, прогресс-бар по стадиям (не статичный), градиентный круг вместо эмодзи
- CarCard: ранг-бейджи (#1, #2, #3), градиентный match%, иконки секций, глубина карточек
- Results: кнопка "Изменить запрос" (Pencil icon) + "Начать заново" (RotateCcw), иконка совета (Lightbulb)
- Chat: градиент на FAB/header/send, lucide иконки, градиентные пузыри сообщений
- ProConItem: цветные кружки с Plus/Minus иконками
- ReviewBadge: иконка Users
- OwnerQuote: декоративная Quote иконка, User иконка
- **UX: "Изменить запрос"** — возврат в квиз с сохранёнными ответами (restoreAnswers в useQuiz + handleEditQuery в App)

#### Изменённые файлы
- `frontend/package.json` — добавлен lucide-react
- `frontend/src/index.css` — новая палитра, shimmer-анимация, улучшенные range-слайдеры
- `frontend/src/hooks/useQuiz.ts` — +restoreAnswers()
- `frontend/src/App.tsx` — +handleEditQuery, lucide Frown, CSS-переменные
- `frontend/src/components/Landing.tsx` — полный редизайн (иконки, градиенты, карточки)
- `frontend/src/components/Quiz.tsx` — сегментированный прогресс, карточка-контейнер, иконки
- `frontend/src/components/QuizQuestion.tsx` — маппинг иконок, pill-кнопки, чекмарки
- `frontend/src/components/Loading.tsx` — иконки стадий, прогресс по стадиям
- `frontend/src/components/Results.tsx` — +onEditQuery, иконки, секционный заголовок
- `frontend/src/components/CarCard.tsx` — ранги, градиенты, иконки, глубина
- `frontend/src/components/ProConItem.tsx` — цветные иконки-кружки
- `frontend/src/components/ReviewBadge.tsx` — Users иконка
- `frontend/src/components/OwnerQuote.tsx` — Quote/User иконки
- `frontend/src/components/Chat.tsx` — градиенты, lucide иконки

#### Тестирование
- [x] `npm run build` — без ошибок TypeScript (251KB JS, 35KB CSS)
- [ ] Ручное тестирование в браузере (dev server)
- [ ] Тест "Изменить запрос" end-to-end
- [ ] Деплой на VPS

#### Следующий шаг
- Запустить `cd frontend && npm run dev` и протестировать все 4 экрана в браузере
- Проверить flow "Изменить запрос": результаты → квиз с ответами → повторная отправка
- Собрать и задеплоить: `VITE_API_URL="" npm run build` → scp на VPS

#### Статус
⏳ В процессе — код готов, сборка успешна, ожидает ручного тестирования и деплоя

### 2026-02-21 - Интеграция shadcn/ui — консистентная дизайн-система

#### Что сделано
- Исследованы 9 UI-библиотек (shadcn/ui, Headless UI, daisyUI 5, Ark UI, HeroUI, Mantine, MUI, Park UI, Radix)
- Выбран **shadcn/ui** — полная поддержка React 19 + Tailwind CSS 4 (без tailwind.config.js), copy-paste подход
- Установлены зависимости: class-variance-authority, clsx, tailwind-merge, tw-animate-css, radix-ui
- Настроена инфраструктура:
  - Path alias `@/*` в tsconfig.json, tsconfig.app.json, vite.config.ts
  - `cn()` утилита в src/lib/utils.ts
  - `components.json` для shadcn CLI (rsc: false, Vite SPA)
  - Полная реструктуризация index.css: `@theme inline` с OKLCH токенами, маппинг бренд-цветов
- Добавлены shadcn-компоненты через CLI:
  - Базовые: Button (+ кастомный вариант `gradient`), Card, Badge (+ варианты `success`, `warning`, `match`)
  - Формы: Progress, Slider, Toggle, ToggleGroup, Input, Tooltip
- Мигрированы ВСЕ 12 компонентов приложения + App.tsx:
  - ReviewBadge → Badge (secondary)
  - ProConItem → cn() + семантические цвета (success/destructive)
  - OwnerQuote → cn() + border-primary, bg-muted
  - Landing → Button (gradient), Card, CardContent
  - Results → Button (outline, gradient), text-primary
  - CarCard → Card, CardContent, Badge, Button (outline, gradient, asChild)
  - Loading → Progress, bg-primary, text-primary-foreground
  - Quiz → Button (outline, default, gradient), Card, CardContent, cn()
  - Chat → Button (gradient, ghost), Input, cn()
  - QuizQuestion → Button (outline), cn() для всех 4 типов вопросов
  - App → Button (gradient), bg-background, text-foreground
- Все `var(--color-*)` заменены на семантические классы: text-primary, bg-secondary, text-muted-foreground и т.д.
- Все `w-N h-N` заменены на `size-N` (Tailwind CSS 4 shorthand)

#### Изменённые файлы
- `frontend/package.json` — +5 новых зависимостей
- `frontend/tsconfig.json` — +path alias @/*
- `frontend/tsconfig.app.json` — +path alias @/*
- `frontend/vite.config.ts` — +path resolve alias
- `frontend/components.json` — новый файл, shadcn CLI конфиг
- `frontend/src/lib/utils.ts` — новый файл, cn() утилита
- `frontend/src/index.css` — полная реструктуризация: @theme inline, OKLCH токены, сохранены анимации
- `frontend/src/components/ui/button.tsx` — shadcn + кастомный gradient вариант
- `frontend/src/components/ui/card.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/badge.tsx` — shadcn + success/warning/match варианты
- `frontend/src/components/ui/progress.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/slider.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/toggle.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/toggle-group.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/input.tsx` — shadcn (без изменений)
- `frontend/src/components/ui/tooltip.tsx` — shadcn (без изменений)
- `frontend/src/App.tsx` — Button, bg-background, семантические цвета
- `frontend/src/components/ReviewBadge.tsx` — Badge component
- `frontend/src/components/ProConItem.tsx` — cn(), семантические цвета
- `frontend/src/components/OwnerQuote.tsx` — cn(), семантические цвета
- `frontend/src/components/Landing.tsx` — Button (gradient), Card
- `frontend/src/components/Results.tsx` — Button (outline), семантические цвета
- `frontend/src/components/CarCard.tsx` — Card, Badge, Button
- `frontend/src/components/Loading.tsx` — Progress, семантические цвета
- `frontend/src/components/Quiz.tsx` — Button (outline/default/gradient), Card
- `frontend/src/components/Chat.tsx` — Button (gradient/ghost), Input
- `frontend/src/components/QuizQuestion.tsx` — Button (outline), cn()

#### Размер сборки
- До: 251KB JS (75KB gz) + 34KB CSS (7KB gz)
- После: 285KB JS (87KB gz) + 49KB CSS (9KB gz)
- Прирост: +34KB JS (+12KB gz), +15KB CSS (+2KB gz)

#### Тестирование
- [x] TypeScript компиляция без ошибок
- [x] Vite build успешен
- [ ] Ручное тестирование в браузере (npm run dev)
- [ ] Деплой на VPS

#### Следующий шаг
- Запустить `cd frontend && npm run dev` и проверить все экраны визуально
- Проверить соответствие цветов (OKLCH → hex может дать небольшие отклонения)
- При необходимости подкрутить OKLCH значения в index.css
- Собрать и задеплоить: `VITE_API_URL="" npm run build` → scp на VPS

#### Статус
⏳ В процессе — сборка ОК, ожидает ручного тестирования и деплоя
