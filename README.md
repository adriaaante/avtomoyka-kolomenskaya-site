# Автомойка Коломенская — сайт-визитка

Премиум сайт-визитка автомойки на Нагатинской ул., 1б, стр. 2 (м. Коломенская).
Сделано на **Astro 5 + Tailwind CSS + GSAP**, деплой — на **GitHub Pages**.

- Чистый статический сайт, не собирает персональные данные → **регистрация в Роскомнадзоре не нужна**.
- Все обращения — звонком или в мессенджеры (никаких форм с именем/телефоном).
- Анимации GSAP с уважением к `prefers-reduced-motion`.
- Структурированные данные `schema.org/AutoWash` для богатых сниппетов в Яндекс / Google.

## Быстрый старт

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # сборка в dist/
npm run preview
```

## Как обновить контент

Весь контент лежит в человекочитаемых файлах. Не нужно знать программирование.

### 1. Изменить телефон / адрес / часы работы

Откройте `src/data/site.ts` — измените значения, сохраните, закоммитьте.
Изменится **везде на сайте** (шапка, футер, карта, JSON-LD, CTA).

### 2. Добавить фото в галерею

1. Положите фото в одну из папок:
   - `public/gallery/exterior/` — кузов
   - `public/gallery/interior/` — салон
   - `public/gallery/polish/` — полировка
   - `public/gallery/before-after/` — пары «до/после»

2. Создайте файл `src/content/gallery/2026-06-моя-работа.md`:

   ```md
   ---
   title: "Audi A6 — комплексная мойка"
   category: "exterior"      # exterior | interior | polish | detailing
   date: 2026-06-15
   car: "Audi A6"
   image: "/gallery/exterior/audi-a6.jpg"
   order: 5                  # меньше = выше в галерее
   ---
   Короткое описание (опционально).
   ```

3. `git commit && git push` — GitHub Actions сам пересоберёт сайт.

### 3. Добавить услугу

Создайте `src/content/services/моя-услуга.md`:

```md
---
title: "Бронепленка"
category: "detailing"      # complex | exterior | interior | polish | detailing | extra
icon: "shield-check"       # см. список иконок в src/components/ui/Icon.astro
priceFrom: 45000
duration: "от 1 дня"
order: 55
featured: false            # true → бейдж «Хит»
highlights:
  - "Антигравийная защита"
  - "Самовосстанавливающийся слой"
  - "Прозрачная или матовая"
---

Текст карточки — что получит клиент.
```

### 4. Добавить отзыв

Создайте `src/content/reviews/имя-клиента.md`:

```md
---
author: "Иван П."
rating: 5
date: 2026-05-20
car: "Porsche Cayenne"
order: 5
---

Текст отзыва.
```

## Структура проекта

```
src/
├── content/
│   ├── services/    # .md услуги — добавляйте новые сюда
│   ├── gallery/     # .md примеры работ
│   └── reviews/     # .md отзывы
├── data/site.ts     # ★ телефон, адрес, часы, преимущества, процесс
├── components/      # секции страницы
├── layouts/Base.astro
├── pages/index.astro
└── scripts/animations.ts  # GSAP, lightbox, before/after, фильтры галереи
public/
├── gallery/         # сами файлы изображений (jpg/png/svg/webp)
├── favicon.svg
└── og-image.svg     # картинка для соцсетей при шеринге
```

## Деплой на GitHub Pages

1. В репозитории: **Settings → Pages → Source: GitHub Actions**.
2. Запушьте в `main` — workflow `.github/workflows/deploy.yml` соберёт и опубликует.
3. Адрес: `https://<ваш-юзер>.github.io/avtomoyka-kolomenskaya-site/`.

Если поменяете имя репозитория или подключите свой домен, обновите `site` и `base` в `astro.config.mjs`. Для своего домена создайте `public/CNAME` с одной строкой — доменом.

## Соответствие требованиям Роскомнадзора

Сайт **не собирает персональные данные**:

- Нет форм с именем/телефоном/email.
- Кнопки — только `tel:` и ссылки в мессенджеры.
- Без cookies для трекинга и без аналитики, собирающей ПДн.
- Карта Яндекса встроена через iframe — Яндекс сам обрабатывает свои ПДн.

В футере есть короткая заметка об этом для прозрачности перед клиентами.

## Технологии

- [Astro 5](https://astro.build) — статический генератор сайтов
- [Tailwind CSS](https://tailwindcss.com) — утилитарный CSS
- [GSAP + ScrollTrigger](https://gsap.com) — анимации
- Manrope + Unbounded — типографика
