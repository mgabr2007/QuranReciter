export interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  totalAyahs: number;
  revelation: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Ayah {
  id: number;
  surahId: number;
  number: number;
  text: string;
  translation: string;
  textUthmani: string | null;
  textSimple: string | null;
  translationSahih: string | null;
  translationPickthall: string | null;
  translationYusufali: string | null;
  juz: number | null;
  manzil: number | null;
  page: number | null;
  ruku: number | null;
  hizbQuarter: number | null;
  sajda: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserPreferences {
  id: number;
  userId: number | null;
  pauseDuration: number;
  noPause: boolean;
  autoRepeat: boolean;
  autoRepeatAyah: boolean;
  lastSurah: number | null;
  lastAyah: number | null;
  language: string;
}

export interface RecitationSession {
  id: number;
  userId: number | null;
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  completedAyahs: number;
  sessionTime: number;
  pauseDuration: number;
  isCompleted: boolean;
  reciterName: string | null;
  createdAt: string;
}

export interface BookmarkedAyah {
  id: number;
  userId: number | null;
  surahId: number;
  ayahNumber: number;
  notes: string | null;
  tags: string | null;
  isFavorite: boolean | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}
