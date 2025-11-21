export interface JuzBoundary {
  surah: number;
  ayah: number;
}

export const JUZ_BOUNDARIES: JuzBoundary[] = [
  { surah: 1, ayah: 1 },
  { surah: 2, ayah: 142 },
  { surah: 2, ayah: 253 },
  { surah: 3, ayah: 93 },
  { surah: 4, ayah: 24 },
  { surah: 4, ayah: 148 },
  { surah: 5, ayah: 82 },
  { surah: 6, ayah: 111 },
  { surah: 7, ayah: 88 },
  { surah: 8, ayah: 41 },
  { surah: 9, ayah: 93 },
  { surah: 11, ayah: 6 },
  { surah: 12, ayah: 53 },
  { surah: 15, ayah: 1 },
  { surah: 17, ayah: 1 },
  { surah: 18, ayah: 75 },
  { surah: 21, ayah: 1 },
  { surah: 23, ayah: 1 },
  { surah: 25, ayah: 21 },
  { surah: 27, ayah: 56 },
  { surah: 29, ayah: 46 },
  { surah: 33, ayah: 31 },
  { surah: 36, ayah: 28 },
  { surah: 39, ayah: 32 },
  { surah: 41, ayah: 47 },
  { surah: 46, ayah: 1 },
  { surah: 51, ayah: 31 },
  { surah: 58, ayah: 1 },
  { surah: 67, ayah: 1 },
  { surah: 78, ayah: 1 },
];

export const AYAHS_PER_JUZ: { [key: number]: number } = {
  1: 148, 2: 111, 3: 126, 4: 132, 5: 124, 6: 111, 7: 149, 8: 142, 9: 127,
  10: 129, 11: 109, 12: 111, 13: 110, 14: 109, 15: 128, 16: 110, 17: 111,
  18: 105, 19: 113, 20: 127, 21: 112, 22: 78, 23: 118, 24: 119, 25: 77,
  26: 93, 27: 113, 28: 76, 29: 108, 30: 527
};

export function getJuzNumber(surahId: number, ayahNumber: number): number {
  for (let i = JUZ_BOUNDARIES.length - 1; i >= 0; i--) {
    const boundary = JUZ_BOUNDARIES[i];
    if (surahId > boundary.surah || (surahId === boundary.surah && ayahNumber >= boundary.ayah)) {
      return i + 1;
    }
  }
  return 1;
}

export function getJuzRange(juzNumber: number): { start: JuzBoundary; end: JuzBoundary | null } {
  if (juzNumber < 1 || juzNumber > 30) {
    throw new Error("Juz number must be between 1 and 30");
  }

  const start = JUZ_BOUNDARIES[juzNumber - 1];
  const end = juzNumber === 30 ? null : JUZ_BOUNDARIES[juzNumber];

  return { start, end };
}

export function isAyahInJuz(surahId: number, ayahNumber: number, juzNumber: number): boolean {
  return getJuzNumber(surahId, ayahNumber) === juzNumber;
}

export function getTotalAyahsInJuz(juzNumber: number): number {
  if (juzNumber < 1 || juzNumber > 30) {
    throw new Error("Juz number must be between 1 and 30");
  }
  return AYAHS_PER_JUZ[juzNumber];
}

export function getCurrentWeekFridayStart(date: Date = new Date()): string {
  const dayOfWeek = date.getDay();
  const friday = 5;
  
  const daysToSubtract = (dayOfWeek + 2) % 7;
  
  const fridayDate = new Date(date);
  fridayDate.setDate(date.getDate() - daysToSubtract);
  fridayDate.setHours(0, 0, 0, 0);
  
  const year = fridayDate.getFullYear();
  const month = String(fridayDate.getMonth() + 1).padStart(2, '0');
  const day = String(fridayDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
