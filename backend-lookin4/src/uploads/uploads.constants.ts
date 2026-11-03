import { join } from 'node:path';

/** Тека, куди лягають файли користувачів. */
export const UPLOAD_DIR = join(process.cwd(), 'user_files');

/** Публічний префікс, за яким ці файли віддаються. */
export const UPLOAD_PREFIX = '/files';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

/**
 * Розширення виводимо з MIME-типу, а не з імені файлу.
 * Ім'я приходить від клієнта, тому в ньому може бути що завгодно —
 * від `../../.env` до `logo.png.exe`.
 */
export const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
};
