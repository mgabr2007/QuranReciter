import { db } from "./db";
import { surahs, ayahs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Quran data from reliable sources
const surahsData = [
  { id: 1, name: "Al-Fatiha", nameArabic: "الفاتحة", nameTranslation: "The Opening", totalAyahs: 7, revelation: "Meccan" },
  { id: 2, name: "Al-Baqarah", nameArabic: "البقرة", nameTranslation: "The Cow", totalAyahs: 286, revelation: "Medinan" },
  { id: 3, name: "Ali 'Imran", nameArabic: "آل عمران", nameTranslation: "Family of Imran", totalAyahs: 200, revelation: "Medinan" },
  { id: 4, name: "An-Nisa", nameArabic: "النساء", nameTranslation: "The Women", totalAyahs: 176, revelation: "Medinan" },
  { id: 5, name: "Al-Ma'idah", nameArabic: "المائدة", nameTranslation: "The Table Spread", totalAyahs: 120, revelation: "Medinan" },
  { id: 6, name: "Al-An'am", nameArabic: "الأنعام", nameTranslation: "The Cattle", totalAyahs: 165, revelation: "Meccan" },
  { id: 7, name: "Al-A'raf", nameArabic: "الأعراف", nameTranslation: "The Heights", totalAyahs: 206, revelation: "Meccan" },
  { id: 8, name: "Al-Anfal", nameArabic: "الأنفال", nameTranslation: "The Spoils of War", totalAyahs: 75, revelation: "Medinan" },
  { id: 9, name: "At-Tawbah", nameArabic: "التوبة", nameTranslation: "The Repentance", totalAyahs: 129, revelation: "Medinan" },
  { id: 10, name: "Yunus", nameArabic: "يونس", nameTranslation: "Jonah", totalAyahs: 109, revelation: "Meccan" },
  { id: 11, name: "Hud", nameArabic: "هود", nameTranslation: "Hud", totalAyahs: 123, revelation: "Meccan" },
  { id: 12, name: "Yusuf", nameArabic: "يوسف", nameTranslation: "Joseph", totalAyahs: 111, revelation: "Meccan" },
  { id: 13, name: "Ar-Ra'd", nameArabic: "الرعد", nameTranslation: "The Thunder", totalAyahs: 43, revelation: "Medinan" },
  { id: 14, name: "Ibrahim", nameArabic: "ابراهيم", nameTranslation: "Abraham", totalAyahs: 52, revelation: "Meccan" },
  { id: 15, name: "Al-Hijr", nameArabic: "الحجر", nameTranslation: "The Rocky Tract", totalAyahs: 99, revelation: "Meccan" },
  { id: 16, name: "An-Nahl", nameArabic: "النحل", nameTranslation: "The Bee", totalAyahs: 128, revelation: "Meccan" },
  { id: 17, name: "Al-Isra", nameArabic: "الإسراء", nameTranslation: "The Night Journey", totalAyahs: 111, revelation: "Meccan" },
  { id: 18, name: "Al-Kahf", nameArabic: "الكهف", nameTranslation: "The Cave", totalAyahs: 110, revelation: "Meccan" },
  { id: 19, name: "Maryam", nameArabic: "مريم", nameTranslation: "Mary", totalAyahs: 98, revelation: "Meccan" },
  { id: 20, name: "Taha", nameArabic: "طه", nameTranslation: "Ta-Ha", totalAyahs: 135, revelation: "Meccan" },
  { id: 21, name: "Al-Anbya", nameArabic: "الأنبياء", nameTranslation: "The Prophets", totalAyahs: 112, revelation: "Meccan" },
  { id: 22, name: "Al-Hajj", nameArabic: "الحج", nameTranslation: "The Pilgrimage", totalAyahs: 78, revelation: "Medinan" },
  { id: 23, name: "Al-Mu'minun", nameArabic: "المؤمنون", nameTranslation: "The Believers", totalAyahs: 118, revelation: "Meccan" },
  { id: 24, name: "An-Nur", nameArabic: "النور", nameTranslation: "The Light", totalAyahs: 64, revelation: "Medinan" },
  { id: 25, name: "Al-Furqan", nameArabic: "الفرقان", nameTranslation: "The Criterion", totalAyahs: 77, revelation: "Meccan" },
  { id: 26, name: "Ash-Shu'ara", nameArabic: "الشعراء", nameTranslation: "The Poets", totalAyahs: 227, revelation: "Meccan" },
  { id: 27, name: "An-Naml", nameArabic: "النمل", nameTranslation: "The Ant", totalAyahs: 93, revelation: "Meccan" },
  { id: 28, name: "Al-Qasas", nameArabic: "القصص", nameTranslation: "The Stories", totalAyahs: 88, revelation: "Meccan" },
  { id: 29, name: "Al-'Ankabut", nameArabic: "العنكبوت", nameTranslation: "The Spider", totalAyahs: 69, revelation: "Meccan" },
  { id: 30, name: "Ar-Rum", nameArabic: "الروم", nameTranslation: "The Romans", totalAyahs: 60, revelation: "Meccan" },
  { id: 31, name: "Luqman", nameArabic: "لقمان", nameTranslation: "Luqman", totalAyahs: 34, revelation: "Meccan" },
  { id: 32, name: "As-Sajdah", nameArabic: "السجدة", nameTranslation: "The Prostration", totalAyahs: 30, revelation: "Meccan" },
  { id: 33, name: "Al-Ahzab", nameArabic: "الأحزاب", nameTranslation: "The Clans", totalAyahs: 73, revelation: "Medinan" },
  { id: 34, name: "Saba", nameArabic: "سبأ", nameTranslation: "Sheba", totalAyahs: 54, revelation: "Meccan" },
  { id: 35, name: "Fatir", nameArabic: "فاطر", nameTranslation: "Originator", totalAyahs: 45, revelation: "Meccan" },
  { id: 36, name: "Ya-Sin", nameArabic: "يس", nameTranslation: "Ya Sin", totalAyahs: 83, revelation: "Meccan" },
  { id: 37, name: "As-Saffat", nameArabic: "الصافات", nameTranslation: "Those Who Set The Ranks", totalAyahs: 182, revelation: "Meccan" },
  { id: 38, name: "Sad", nameArabic: "ص", nameTranslation: "The Letter 'Sad'", totalAyahs: 88, revelation: "Meccan" },
  { id: 39, name: "Az-Zumar", nameArabic: "الزمر", nameTranslation: "The Troops", totalAyahs: 75, revelation: "Meccan" },
  { id: 40, name: "Ghafir", nameArabic: "غافر", nameTranslation: "The Forgiver", totalAyahs: 85, revelation: "Meccan" },
  { id: 41, name: "Fussilat", nameArabic: "فصلت", nameTranslation: "Explained In Detail", totalAyahs: 54, revelation: "Meccan" },
  { id: 42, name: "Ash-Shuraa", nameArabic: "الشورى", nameTranslation: "The Consultation", totalAyahs: 53, revelation: "Meccan" },
  { id: 43, name: "Az-Zukhruf", nameArabic: "الزخرف", nameTranslation: "The Ornaments Of Gold", totalAyahs: 89, revelation: "Meccan" },
  { id: 44, name: "Ad-Dukhan", nameArabic: "الدخان", nameTranslation: "The Smoke", totalAyahs: 59, revelation: "Meccan" },
  { id: 45, name: "Al-Jathiyah", nameArabic: "الجاثية", nameTranslation: "The Crouching", totalAyahs: 37, revelation: "Meccan" },
  { id: 46, name: "Al-Ahqaf", nameArabic: "الأحقاف", nameTranslation: "The Wind-Curved Sandhills", totalAyahs: 35, revelation: "Meccan" },
  { id: 47, name: "Muhammad", nameArabic: "محمد", nameTranslation: "Muhammad", totalAyahs: 38, revelation: "Medinan" },
  { id: 48, name: "Al-Fath", nameArabic: "الفتح", nameTranslation: "The Victory", totalAyahs: 29, revelation: "Medinan" },
  { id: 49, name: "Al-Hujurat", nameArabic: "الحجرات", nameTranslation: "The Rooms", totalAyahs: 18, revelation: "Medinan" },
  { id: 50, name: "Qaf", nameArabic: "ق", nameTranslation: "The Letter 'Qaf'", totalAyahs: 45, revelation: "Meccan" },
  { id: 51, name: "Adh-Dhariyat", nameArabic: "الذاريات", nameTranslation: "The Winnowing Winds", totalAyahs: 60, revelation: "Meccan" },
  { id: 52, name: "At-Tur", nameArabic: "الطور", nameTranslation: "The Mount", totalAyahs: 49, revelation: "Meccan" },
  { id: 53, name: "An-Najm", nameArabic: "النجم", nameTranslation: "The Star", totalAyahs: 62, revelation: "Meccan" },
  { id: 54, name: "Al-Qamar", nameArabic: "القمر", nameTranslation: "The Moon", totalAyahs: 55, revelation: "Meccan" },
  { id: 55, name: "Ar-Rahman", nameArabic: "الرحمن", nameTranslation: "The Beneficent", totalAyahs: 78, revelation: "Medinan" },
  { id: 56, name: "Al-Waqi'ah", nameArabic: "الواقعة", nameTranslation: "The Inevitable", totalAyahs: 96, revelation: "Meccan" },
  { id: 57, name: "Al-Hadid", nameArabic: "الحديد", nameTranslation: "The Iron", totalAyahs: 29, revelation: "Medinan" },
  { id: 58, name: "Al-Mujadila", nameArabic: "المجادلة", nameTranslation: "The Pleading Woman", totalAyahs: 22, revelation: "Medinan" },
  { id: 59, name: "Al-Hashr", nameArabic: "الحشر", nameTranslation: "The Exile", totalAyahs: 24, revelation: "Medinan" },
  { id: 60, name: "Al-Mumtahanah", nameArabic: "الممتحنة", nameTranslation: "She That Is To Be Examined", totalAyahs: 13, revelation: "Medinan" },
  { id: 61, name: "As-Saff", nameArabic: "الصف", nameTranslation: "The Ranks", totalAyahs: 14, revelation: "Medinan" },
  { id: 62, name: "Al-Jumu'ah", nameArabic: "الجمعة", nameTranslation: "The Congregation", totalAyahs: 11, revelation: "Medinan" },
  { id: 63, name: "Al-Munafiqun", nameArabic: "المنافقون", nameTranslation: "The Hypocrites", totalAyahs: 11, revelation: "Medinan" },
  { id: 64, name: "At-Taghabun", nameArabic: "التغابن", nameTranslation: "The Mutual Disillusion", totalAyahs: 18, revelation: "Medinan" },
  { id: 65, name: "At-Talaq", nameArabic: "الطلاق", nameTranslation: "The Divorce", totalAyahs: 12, revelation: "Medinan" },
  { id: 66, name: "At-Tahrim", nameArabic: "التحريم", nameTranslation: "The Prohibition", totalAyahs: 12, revelation: "Medinan" },
  { id: 67, name: "Al-Mulk", nameArabic: "الملك", nameTranslation: "The Sovereignty", totalAyahs: 30, revelation: "Meccan" },
  { id: 68, name: "Al-Qalam", nameArabic: "القلم", nameTranslation: "The Pen", totalAyahs: 52, revelation: "Meccan" },
  { id: 69, name: "Al-Haqqah", nameArabic: "الحاقة", nameTranslation: "The Reality", totalAyahs: 52, revelation: "Meccan" },
  { id: 70, name: "Al-Ma'arij", nameArabic: "المعارج", nameTranslation: "The Ascending Stairways", totalAyahs: 44, revelation: "Meccan" },
  { id: 71, name: "Nuh", nameArabic: "نوح", nameTranslation: "Noah", totalAyahs: 28, revelation: "Meccan" },
  { id: 72, name: "Al-Jinn", nameArabic: "الجن", nameTranslation: "The Jinn", totalAyahs: 28, revelation: "Meccan" },
  { id: 73, name: "Al-Muzzammil", nameArabic: "المزمل", nameTranslation: "The Enshrouded One", totalAyahs: 20, revelation: "Meccan" },
  { id: 74, name: "Al-Muddaththir", nameArabic: "المدثر", nameTranslation: "The Cloaked One", totalAyahs: 56, revelation: "Meccan" },
  { id: 75, name: "Al-Qiyamah", nameArabic: "القيامة", nameTranslation: "The Resurrection", totalAyahs: 40, revelation: "Meccan" },
  { id: 76, name: "Al-Insan", nameArabic: "الإنسان", nameTranslation: "The Man", totalAyahs: 31, revelation: "Medinan" },
  { id: 77, name: "Al-Mursalat", nameArabic: "المرسلات", nameTranslation: "The Emissaries", totalAyahs: 50, revelation: "Meccan" },
  { id: 78, name: "An-Naba", nameArabic: "النبأ", nameTranslation: "The Tidings", totalAyahs: 40, revelation: "Meccan" },
  { id: 79, name: "An-Nazi'at", nameArabic: "النازعات", nameTranslation: "Those Who Drag Forth", totalAyahs: 46, revelation: "Meccan" },
  { id: 80, name: "Abasa", nameArabic: "عبس", nameTranslation: "He Frowned", totalAyahs: 42, revelation: "Meccan" },
  { id: 81, name: "At-Takwir", nameArabic: "التكوير", nameTranslation: "The Overthrowing", totalAyahs: 29, revelation: "Meccan" },
  { id: 82, name: "Al-Infitar", nameArabic: "الإنفطار", nameTranslation: "The Cleaving", totalAyahs: 19, revelation: "Meccan" },
  { id: 83, name: "Al-Mutaffifin", nameArabic: "المطففين", nameTranslation: "The Defrauding", totalAyahs: 36, revelation: "Meccan" },
  { id: 84, name: "Al-Inshiqaq", nameArabic: "الإنشقاق", nameTranslation: "The Sundering", totalAyahs: 25, revelation: "Meccan" },
  { id: 85, name: "Al-Buruj", nameArabic: "البروج", nameTranslation: "The Mansions Of The Stars", totalAyahs: 22, revelation: "Meccan" },
  { id: 86, name: "At-Tariq", nameArabic: "الطارق", nameTranslation: "The Morning Star", totalAyahs: 17, revelation: "Meccan" },
  { id: 87, name: "Al-A'la", nameArabic: "الأعلى", nameTranslation: "The Most High", totalAyahs: 19, revelation: "Meccan" },
  { id: 88, name: "Al-Ghashiyah", nameArabic: "الغاشية", nameTranslation: "The Overwhelming", totalAyahs: 26, revelation: "Meccan" },
  { id: 89, name: "Al-Fajr", nameArabic: "الفجر", nameTranslation: "The Dawn", totalAyahs: 30, revelation: "Meccan" },
  { id: 90, name: "Al-Balad", nameArabic: "البلد", nameTranslation: "The City", totalAyahs: 20, revelation: "Meccan" },
  { id: 91, name: "Ash-Shams", nameArabic: "الشمس", nameTranslation: "The Sun", totalAyahs: 15, revelation: "Meccan" },
  { id: 92, name: "Al-Layl", nameArabic: "الليل", nameTranslation: "The Night", totalAyahs: 21, revelation: "Meccan" },
  { id: 93, name: "Ad-Duhaa", nameArabic: "الضحى", nameTranslation: "The Morning Hours", totalAyahs: 11, revelation: "Meccan" },
  { id: 94, name: "Ash-Sharh", nameArabic: "الشرح", nameTranslation: "The Relief", totalAyahs: 8, revelation: "Meccan" },
  { id: 95, name: "At-Tin", nameArabic: "التين", nameTranslation: "The Fig", totalAyahs: 8, revelation: "Meccan" },
  { id: 96, name: "Al-'Alaq", nameArabic: "العلق", nameTranslation: "The Clot", totalAyahs: 19, revelation: "Meccan" },
  { id: 97, name: "Al-Qadr", nameArabic: "القدر", nameTranslation: "The Power", totalAyahs: 5, revelation: "Meccan" },
  { id: 98, name: "Al-Bayyinah", nameArabic: "البينة", nameTranslation: "The Clear Proof", totalAyahs: 8, revelation: "Medinan" },
  { id: 99, name: "Az-Zalzalah", nameArabic: "الزلزلة", nameTranslation: "The Earthquake", totalAyahs: 8, revelation: "Medinan" },
  { id: 100, name: "Al-'Adiyat", nameArabic: "العاديات", nameTranslation: "The Courser", totalAyahs: 11, revelation: "Meccan" },
  { id: 101, name: "Al-Qari'ah", nameArabic: "القارعة", nameTranslation: "The Calamity", totalAyahs: 11, revelation: "Meccan" },
  { id: 102, name: "At-Takathur", nameArabic: "التكاثر", nameTranslation: "The Rivalry In World Increase", totalAyahs: 8, revelation: "Meccan" },
  { id: 103, name: "Al-'Asr", nameArabic: "العصر", nameTranslation: "The Declining Day", totalAyahs: 3, revelation: "Meccan" },
  { id: 104, name: "Al-Humazah", nameArabic: "الهمزة", nameTranslation: "The Traducer", totalAyahs: 9, revelation: "Meccan" },
  { id: 105, name: "Al-Fil", nameArabic: "الفيل", nameTranslation: "The Elephant", totalAyahs: 5, revelation: "Meccan" },
  { id: 106, name: "Quraysh", nameArabic: "قريش", nameTranslation: "Quraysh", totalAyahs: 4, revelation: "Meccan" },
  { id: 107, name: "Al-Ma'un", nameArabic: "الماعون", nameTranslation: "The Small Kindnesses", totalAyahs: 7, revelation: "Meccan" },
  { id: 108, name: "Al-Kawthar", nameArabic: "الكوثر", nameTranslation: "The Abundance", totalAyahs: 3, revelation: "Meccan" },
  { id: 109, name: "Al-Kafirun", nameArabic: "الكافرون", nameTranslation: "The Disbelievers", totalAyahs: 6, revelation: "Meccan" },
  { id: 110, name: "An-Nasr", nameArabic: "النصر", nameTranslation: "The Divine Support", totalAyahs: 3, revelation: "Medinan" },
  { id: 111, name: "Al-Masad", nameArabic: "المسد", nameTranslation: "The Palm Fibre", totalAyahs: 5, revelation: "Meccan" },
  { id: 112, name: "Al-Ikhlas", nameArabic: "الإخلاص", nameTranslation: "The Sincerity", totalAyahs: 4, revelation: "Meccan" },
  { id: 113, name: "Al-Falaq", nameArabic: "الفلق", nameTranslation: "The Daybreak", totalAyahs: 5, revelation: "Meccan" },
  { id: 114, name: "An-Nas", nameArabic: "الناس", nameTranslation: "The Mankind", totalAyahs: 6, revelation: "Meccan" }
];

async function populateSurahs() {
  console.log("Populating surahs...");
  
  for (const surahData of surahsData) {
    try {
      // Check if surah already exists
      const existingSurah = await db
        .select()
        .from(surahs)
        .where(eq(surahs.id, surahData.id))
        .limit(1);

      if (existingSurah.length === 0) {
        await db.insert(surahs).values({
          id: surahData.id,
          name: surahData.name,
          nameArabic: surahData.nameArabic,
          nameTranslation: surahData.nameTranslation,
          totalAyahs: surahData.totalAyahs,
          revelation: surahData.revelation as "Meccan" | "Medinan",
        });
        console.log(`Added Surah ${surahData.id}: ${surahData.name}`);
      } else {
        console.log(`Surah ${surahData.id} already exists`);
      }
    } catch (error) {
      console.error(`Error processing Surah ${surahData.id}:`, error);
    }
  }
}

async function populateAyahs() {
  console.log("Populating ayahs from API...");
  
  const allSurahs = await db.select().from(surahs).orderBy(surahs.id);
  
  for (const surah of allSurahs) {
    console.log(`Processing Surah ${surah.id}: ${surah.name}`);
    
    try {
      // Check if ayahs already exist
      const existingAyahs = await db
        .select()
        .from(ayahs)
        .where(eq(ayahs.surahId, surah.id))
        .limit(1);

      if (existingAyahs.length > 0) {
        console.log(`Ayahs for Surah ${surah.id} already exist, skipping`);
        continue;
      }

      // Fetch from API
      const arabicResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/ar.asad`);
      const englishResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surah.id}/en.sahih`);
      
      if (!arabicResponse.ok || !englishResponse.ok) {
        console.error(`Failed to fetch data for Surah ${surah.id}`);
        continue;
      }

      const arabicData = await arabicResponse.json();
      const englishData = await englishResponse.json();

      if (arabicData.code !== 200 || englishData.code !== 200) {
        console.error(`API error for Surah ${surah.id}`);
        continue;
      }

      const arabicAyahs = arabicData.data.ayahs;
      const englishAyahs = englishData.data.ayahs;

      for (let i = 0; i < arabicAyahs.length; i++) {
        const arabicAyah = arabicAyahs[i];
        const englishAyah = englishAyahs[i];

        await db.insert(ayahs).values({
          surahId: surah.id,
          number: arabicAyah.numberInSurah,
          text: arabicAyah.text,
          translation: englishAyah.text,
          textUthmani: arabicAyah.text,
          textSimple: arabicAyah.text,
          translationSahih: englishAyah.text,
          translationPickthall: null,
          translationYusufali: null,
          juz: arabicAyah.juz || null,
          manzil: arabicAyah.manzil || null,
          page: arabicAyah.page || null,
          ruku: arabicAyah.ruku || null,
          hizbQuarter: arabicAyah.hizbQuarter || null,
          sajda: arabicAyah.sajda || false,
        });
      }

      console.log(`Completed Surah ${surah.id} (${arabicAyahs.length} ayahs)`);
      
      // Small delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing Surah ${surah.id}:`, error);
    }
  }
}

async function populateDatabase() {
  console.log("Starting database population...");
  
  try {
    await populateSurahs();
    await populateAyahs();
    
    const surahCount = await db.select().from(surahs);
    const ayahCount = await db.select().from(ayahs);
    
    console.log(`Database populated successfully!`);
    console.log(`Total Surahs: ${surahCount.length}`);
    console.log(`Total Ayahs: ${ayahCount.length}`);
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

// Run the population
populateDatabase();