// Ultra-simple audio system - no API calls, no loops
const formatNumber = (num: number, padding: number): string => {
  return num.toString().padStart(padding, '0');
};

export const getSimpleAudioUrl = (surahId: number, ayahNumber: number): string => {
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  return `/audio/alafasy/${filename}`;
};

export const getSimpleAlternativeAudioUrl = (surahId: number, ayahNumber: number): string => {
  const filename = `${formatNumber(surahId, 3)}${formatNumber(ayahNumber, 3)}.mp3`;
  return `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${filename}`;
};