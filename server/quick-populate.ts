import { db } from "./db";
import { ayahs } from "@shared/schema";
import { eq } from "drizzle-orm";

// Quick sample data for first 3 surahs to test functionality
const sampleAyahs = [
  // Al-Fatiha (already populated, but adding for consistency)
  { surahId: 1, number: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
  { surahId: 1, number: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of the worlds." },
  { surahId: 1, number: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ", translation: "The Entirely Merciful, the Especially Merciful," },
  { surahId: 1, number: 4, text: "مَالِكِ يَوْمِ الدِّينِ", translation: "Sovereign of the Day of Recompense." },
  { surahId: 1, number: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "It is You we worship and You we ask for help." },
  { surahId: 1, number: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translation: "Guide us to the straight path -" },
  { surahId: 1, number: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", translation: "The path of those upon whom You have bestowed favor, not of those who have evoked Your anger or of those who are astray." },
  
  // Al-Baqarah (first 10 ayahs)
  { surahId: 2, number: 1, text: "الم", translation: "Alif, Lam, Meem." },
  { surahId: 2, number: 2, text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ", translation: "This is the Book about which there is no doubt, a guidance for those conscious of Allah -" },
  { surahId: 2, number: 3, text: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ", translation: "Who believe in the unseen, establish prayer, and spend out of what We have provided for them," },
  { surahId: 2, number: 4, text: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ وَمَا أُنْزِلَ مِنْ قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", translation: "And who believe in what has been revealed to you, and what was revealed before you, and of the Hereafter they are certain in faith." },
  { surahId: 2, number: 5, text: "أُولَٰئِكَ عَلَىٰ هُدًى مِنْ رَبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ", translation: "Those are upon guidance from their Lord, and it is those who are the successful." },
  
  // Ali 'Imran (first 5 ayahs)
  { surahId: 3, number: 1, text: "الم", translation: "Alif, Lam, Meem." },
  { surahId: 3, number: 2, text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence." },
  { surahId: 3, number: 3, text: "نَزَّلَ عَلَيْكَ الْكِتَابَ بِالْحَقِّ مُصَدِّقًا لِمَا بَيْنَ يَدَيْهِ وَأَنْزَلَ التَّوْرَاةَ وَالْإِنْجِيلَ", translation: "He has sent down upon you, the Book in truth, confirming what was before it. And He revealed the Torah and the Gospel." },
  { surahId: 3, number: 4, text: "مِنْ قَبْلُ هُدًى لِلنَّاسِ وَأَنْزَلَ الْفُرْقَانَ ۗ إِنَّ الَّذِينَ كَفَرُوا بِآيَاتِ اللَّهِ لَهُمْ عَذَابٌ شَدِيدٌ ۗ وَاللَّهُ عَزِيزٌ ذُو انْتِقَامٍ", translation: "Before, as guidance for the people. And He revealed the Qur'an. Indeed, those who disbelieve in the verses of Allah will have a severe punishment, and Allah is exalted in Might, the Owner of Retribution." },
  { surahId: 3, number: 5, text: "إِنَّ اللَّهَ لَا يَخْفَىٰ عَلَيْهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ", translation: "Indeed, from Allah nothing is hidden in the earth nor in the heaven." }
];

async function quickPopulate() {
  console.log("Adding sample ayahs for testing...");
  
  for (const ayahData of sampleAyahs) {
    try {
      // Check if ayah already exists
      const existing = await db
        .select()
        .from(ayahs)
        .where(eq(ayahs.surahId, ayahData.surahId) && eq(ayahs.number, ayahData.number))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(ayahs).values({
          surahId: ayahData.surahId,
          number: ayahData.number,
          text: ayahData.text,
          translation: ayahData.translation,
          textUthmani: ayahData.text,
          textSimple: ayahData.text,
          translationSahih: ayahData.translation,
          translationPickthall: null,
          translationYusufali: null,
          juz: null,
          manzil: null,
          page: null,
          ruku: null,
          hizbQuarter: null,
          sajda: false,
        });
        console.log(`Added Surah ${ayahData.surahId}, Ayah ${ayahData.number}`);
      } else {
        console.log(`Surah ${ayahData.surahId}, Ayah ${ayahData.number} already exists`);
      }
    } catch (error) {
      console.error(`Error adding Surah ${ayahData.surahId}, Ayah ${ayahData.number}:`, error);
    }
  }
  
  console.log("Quick population completed!");
}

quickPopulate();