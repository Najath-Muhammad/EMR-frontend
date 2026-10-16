
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  const raw = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (raw.length === 10) {
    return `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
  }
  return phone;
}
