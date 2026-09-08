export function validateName(v: string): string | null {
  return v.trim().length < 2 ? 'Введите имя (минимум 2 символа)' : null;
}

export function validateEmail(v: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Введите корректный email';
}

export function formatPhone(v: string): string | null {
  const d = v.replace(/\D/g, '');

  const norm =
    d.length === 11 && (d[0] === '7' || d[0] === '8')
      ? '7' + d.slice(1)
      : d.length === 10
        ? '7' + d
        : null;

  if (!norm) return null;

  return `+${norm[0]} (${norm.slice(1, 4)}) ${norm.slice(4, 7)}-${norm.slice(7, 9)}-${norm.slice(9, 11)}`;
}

export function validatePhone(v: string): string | null {
  return formatPhone(v)
    ? null
    : 'Введите полный номер телефона (+7XXXXXXXXXX, 8XXXXXXXXXX или 10 цифр)';
}

export function validateCity(v: string): string | null {
  return v.trim().length < 2 ? 'Введите город (минимум 2 символа)' : null;
}

export function validateAddress(v: string): string | null {
  return v.trim().length < 5 ? 'Введите адрес (минимум 5 символов)' : null;
}

export function validateMessage(v: string): string | null {
  return v.trim().length >= 10 ? null : 'Сообщение слишком короткое (минимум 10 символов)';
}
