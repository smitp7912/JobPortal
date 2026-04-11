export const DEFAULT_LOGO = 'https://placehold.co/100x100/2563EB/FFFFFF?text=J';

export const fixOldPlaceholderUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('via.placeholder.com')) {
    const match = url.match(/text=([A-Za-z0-9])/);
    const letter = match ? match[1] : 'J';
    return `https://placehold.co/100x100/2563EB/FFFFFF?text=${letter}`;
  }
  return url;
};

export const isValidLogoUrl = (url?: string): boolean => {
  if (!url || url.trim() === '') return false;
  if (url.includes('via.placeholder.com')) return false;
  return true;
};

export const getValidLogoUrl = (url?: string): string => {
  const fixedUrl = fixOldPlaceholderUrl(url || '');
  if (isValidLogoUrl(fixedUrl)) {
    return fixedUrl;
  }
  return DEFAULT_LOGO;
};