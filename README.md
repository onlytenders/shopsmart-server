# ShopSmart 🛒

**ShopSmart** — веб-приложение для совместного создания и управления списками покупок. Пользователи могут регистрироваться, входить, создавать списки, присоединяться к ним по ID и обновлять их в реальном времени. Дизайн использует мятный (`#E6F7FA`), манговый (`#FF8C38`), коралловый (`#FF6B6B`), тёмно-серый (`#2D3748`) и серый (`#A0AEC0`) цвета для интуитивного UX.

## Краткое описание проекта

ShopSmart позволяет:
- Регистрироваться и входить (JWT-аутентификация).
- Создавать списки покупок и присоединяться к существующим.
- Обновлять списки в реальном времени через Socket.IO (`listUpdated`).
- Управлять списками на `/dashboard` и присоединяться на `/join`.
- Скрывать навигацию на `/login` и `/register` для чистого интерфейса.

Проект развёрнут на Vercel (frontend), Render (backend) и MongoDB Atlas (база данных).

Проект разделен на сервер и клиент, GitHub репозитории:
клиент - https://github.com/your-username/shopsmart-client.git
сервер - https://github.com/your-username/shopsmart-server.git


## Технический стек и его выбор

- **Frontend**: React, React Router, Axios, Socket.IO-client.
  - *Почему*: React для быстрого создания компонентов, React Router для SPA-маршрутизации, Axios для HTTP-запросов.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, bcrypt.
  - *Почему*: Express для простого REST API, MongoDB для гибкой NoSQL, Socket.IO для реального времени, JWT/bcrypt для безопасной аутентификации.
- **Хостинг**: Vercel, Render, MongoDB Atlas.
  - *Почему*: Vercel для быстрого деплоя React, Render для Node.js, MongoDB Atlas для бесплатной базы.
- **Стили**: CSS с анимациями (`fadeIn`, `slideIn`).
  - *Почему*: Контроль над дизайном, минимальный размер бандла.

## Инструкции по установке и запуску

### Требования
- Node.js (v16+)
- MongoDB Atlas
- Git
- Vercel CLI (`npm install -g vercel`)
- Render аккаунт

### Локальный запуск

1.  Клонировать репозитории:
    ```bash
    git clone https://github.com/your-username/shopsmart-client.git
    git clone https://github.com/your-username/shopsmart-server.git

2.  Установить зависимости:
    bash

    Копировать
    cd shopsmart-client
    npm install
    cd ../shopsmart-server
    npm install

3.  Настроить переменные окружения:

    shopsmart-client/.env:
    REACT_APP_API_URL=http://localhost:5001

    shopsmart-server/.env:
    MONGO_URI=mongodb+srv://<username>:<password>@shopsmart.abcdef.mongodb.net/shopsmart
    JWT_SECRET=your_jwt_secret
    PORT=5001

4.  Запустить backend:

    cd shopsmart-server
    npm run dev

5.  Запустить frontend:

    cd shopsmart-client
    npm start

6.  Открыть: http://localhost:3000

### Процесс проектирования и разработки
1.  Планирование: Определены функции (регистрация, списки, реальное время), выбрана палитра и стек.
2.  Дизайн: Созданы страницы /login, /register, /dashboard, /join с анимациями и скрытием Navbar на входе/регистрации.
3.  Разработка:
    Frontend: React компоненты, маршруты, запросы через Axios.
    Backend: Express API, MongoDB модели (User, List), Socket.IO.
4.  Тестирование: Локально (DevTools, Postman), на деплое (Vercel/Render).
5.  Деплой: Vercel для frontend, Render для backend, MongoDB Atlas для базы.

### Уникальные подходы
    Цветовая палитра: Мятный (#E6F7FA) и манговый (#FF8C38) для дружелюбного UX, коралловый (#FF6B6B) для ошибок.
    Socket.IO: Реальное время для обновления списков.

### Компромиссы
1.  Vercel + Render:
    Плюс: Vercel для React, Render для Node.js.
    Минус: Сложность настройки CORS, задержки Render.
    Решение: Настроены CORS, добавлено логирование.
2.  CSS вместо фреймворков:
    Плюс: Контроль стилей, лёгкий бандл.
    Минус: Больше времени на стили.
    Решение: Использованы !important для конфликтов.
3.  MongoDB Atlas:
    Плюс: Бесплатно, доступно.
    Минус: Задержки на бесплатном плане.
    Решение: Тестовые данные для стабильности.

### Известные проблемы
1.  Задержка Render: Бесплатный план "засыпает" (~5–10 сек). Решение: Платный план или Heroku.
2.  React Router: Предупреждения о v7 (v7_startTransition, v7_relativeSplatPath). Решение: Обновлён до 6.26.2.
3.  Пустые списки: /dashboard показывает "Нет списков". Решение: Добавить создание списков.
4.  Socket.IO: Редкие сбои на Render. Решение: Retry-логика.

### Контакты
Автор: Рахат Мустафин
Email: rakhat.mustafin@nu.edu.kz
GitHub: onlytenders