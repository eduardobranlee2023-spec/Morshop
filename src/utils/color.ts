export function getContrastColor(hexColor: string): string {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  // Handle 3-digit hex colors
  const fullHex = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  
  if (fullHex.length !== 6) return '#ffffff';

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
