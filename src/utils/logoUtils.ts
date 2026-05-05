export const DEFAULT_LOGO = 'https://ui-avatars.com/api/?name=J&background=2563EB&color=ffffff&size=100&font-size=0.4&bold=true';

export const fixOldPlaceholderUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('via.placeholder.com') || url.includes('placehold.co')) {
    const match = url.match(/text=([A-Za-z0-9])/);
    const letter = match ? match[1] : 'J';
    return `https://ui-avatars.com/api/?name=${letter}&background=2563EB&color=ffffff&size=100&font-size=0.4&bold=true`;
  }
  return url;
};

export const isValidLogoUrl = (url?: string): boolean => {
  if (!url || url.trim() === '') return false;
  if (url.includes('via.placeholder.com') || url.includes('placehold.co')) return false;
  return true;
};

export const getValidLogoUrl = (url?: string): string => {
  const fixedUrl = fixOldPlaceholderUrl(url || '');
  if (isValidLogoUrl(fixedUrl)) {
    return fixedUrl;
  }
  return DEFAULT_LOGO;
};