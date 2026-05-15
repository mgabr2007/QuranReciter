import { db } from "./db";
import { ayahs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface AlQuranCloudAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

interface AlQuranCloudResponse {
  code: number;
  status: string;
  data: {
    ayahs?: AlQuranCloudAyah[];
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${url} (attempt ${i + 1})`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`API Error ${data.code}: ${data.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}

async function populateSurah2() {
  const surahId = 2;
  const startAyah = 6;
  const endAyah = 286;
  
  console.log(`🕌 Populating Surah ${surahId} (Al-Baqarah) - Ayahs ${startAyah} to ${endAyah}`);
  
  try {
    // Fetch Arabic text with metadata
    console.log("📖 Fetching Arabic text...");
    const arabicResponse: AlQuranCloudResponse = await fetchWithRetry(
      `https://api.alquran.cloud/v1/surah/${surahId}/ar.asad`
    );
    
    await sleep(1000);
    
    // Fetch English translation
    console.log("📖 Fetching English translation...");
    const englishResponse: AlQuranCloudResponse = await fetchWithRetry(
      `https://api.alquran.cloud/v1/surah/${surahId}/en.sahih`
    );
    
    await sleep(1000);
    
    // Fetch Uthmani text
    console.log("📖 Fetching Uthmani text...");
    const uthmaniResponse: AlQuranCloudResponse = await fetchWithRetry(
      `https://api.alquran.cloud/v1/surah/${surahId}/ar.uthmani`
    );
    
    const arabicAyahs = arabicResponse.data.ayahs || [];
    const englishAyahs = englishResponse.data.ayahs || [];
    const uthmaniAyahs = uthmaniResponse.data.ayahs || [];
    
    console.log(`📚 Retrieved ${arabicAyahs.length} ayahs from API`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    // Process only ayahs from startAyah to endAyah
    for (let i = startAyah - 1; i < endAyah; i++) {
      const arabicAyah = arabicAyahs[i];
      const englishAyah = englishAyahs[i];
      const uthmaniAyah = uthmaniAyahs[i];
      
      if (!arabicAyah || !englishAyah) {
        console.warn(`⚠️ Missing data for ayah ${i + 1}`);
        continue;
      }
      
      try {
        // Check if ayah already exists
        const existing = await db
          .select()
          .from(ayahs)
          .where(
            and(
              eq(ayahs.surahId, surahId),
              eq(ayahs.number, arabicAyah.numberInSurah)
            )
          )
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(ayahs).values({
            surahId: surahId,
            number: arabicAyah.numberInSurah,
            text: arabicAyah.text,
            translation: englishAyah.text,
            textUthmani: uthmaniAyah?.text || arabicAyah.text,
            textSimple: arabicAyah.text,
            translationSahih: englishAyah.text,
            translationPickthall: null,
            translationYusufali: null,
            juz: arabicAyah.juz,
            manzil: arabicAyah.manzil,
            page: arabicAyah.page,
            ruku: arabicAyah.ruku,
            hizbQuarter: arabicAyah.hizbQuarter,
            sajda: typeof arabicAyah.sajda === 'boolean' ? arabicAyah.sajda : false,
          });
          
          insertedCount++;
          if (insertedCount % 10 === 0) {
            console.log(`✅ Inserted ${insertedCount} ayahs so far...`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error inserting Ayah ${arabicAyah.numberInSurah}:`, error);
      }
    }
    
    console.log(`\n🎉 Completed!`);
    console.log(`✅ Inserted: ${insertedCount} ayahs`);
    console.log(`⏭️ Skipped: ${skippedCount} ayahs (already existed)`);
    
  } catch (error) {
    console.error("💥 Error populating Surah 2:", error);
    throw error;
  }
}

// Run the script
populateSurah2()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
