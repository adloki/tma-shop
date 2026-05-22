import { createHmac } from 'crypto';

/**
 * Серверная валидация Telegram initData
 * @param initData - строка из query-параметров WebApp
 * @param botToken - токен бота из .env
 * @returns Распарсенные данные пользователя
 * @throws ошибка, если хеш не совпадает или данные просрочены
 */
export function validateInitDataServer(initData: string, botToken: string) {
  if (!initData || !botToken) {
    throw new Error('Missing initData or botToken');
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) throw new Error('Missing hash in initData');

  // Удаляем hash из строки для проверки
  urlParams.delete('hash');
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    throw new Error('Invalid initData hash');
  }

  // Проверка времени (опционально, раскомментируй если нужно)
  // const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  // if (Date.now() - authDate * 1000 > 5 * 60 * 1000) {
  //   throw new Error('initData expired');
  // }

  // Парсим данные пользователя
  const userRaw = urlParams.get('user');
  if (!userRaw) throw new Error('Missing user in initData');

  return {
    user: JSON.parse(decodeURIComponent(userRaw)),
    chatInstance: urlParams.get('chat_instance'),
    chatType: urlParams.get('chat_type'),
  };
}