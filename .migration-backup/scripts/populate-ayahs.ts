import { db } from "../server/db";
import { ayahs } from "../shared/schema";
import { sql } from "drizzle-orm";

interface QuranApiAyah {
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

interface QuranApiSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: QuranApiAyah[];
}

interface QuranApiResponse {
  code: number;
  status: string;
  data: QuranApiSurah;
}

async function fetchSurahData(surahNumber: number): Promise<{ arabic: QuranApiSurah; english: QuranApiSurah } | null> {
  try {
    console.log(`Fetching Surah ${surahNumber}...`);
    
    // Fetch Arabic text
    const arabicResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
    if (!arabicResponse.ok) {
      console.error(`Failed to fetch Arabic for Surah ${surahNumber}: ${arabicResponse.status}`);
      return null;
    }
    const arabicData: QuranApiResponse = await arabicResponse.json();
    
    // Fetch English translation (Sahih International)
    const englishResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`);
    if (!englishResponse.ok) {
      console.error(`Failed to fetch English for Surah ${surahNumber}: ${englishResponse.status}`);
      return null;
    }
    const englishData: QuranApiResponse = await englishResponse.json();
    
    return {
      arabic: arabicData.data,
      english: englishData.data
    };
  } catch (error) {
    console.error(`Error fetching Surah ${surahNumber}:`, error);
    return null;
  }
}

async function populateAyahs() {
  console.log("Starting to populate ayahs for all 114 surahs...\n");
  
  let totalAyahs = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (let surahId = 1; surahId <= 114; surahId++) {
    try {
      // Check if ayahs already exist for this surah
      const existing = await db.query.ayahs.findFirst({
        where: sql`${ayahs.surahId} = ${surahId}`,
      });
      
      if (existing) {
        console.log(`✓ Surah ${surahId} already has ayahs in database, skipping...`);
        continue;
      }
      
      // Fetch surah data from API
      const surahData = await fetchSurahData(surahId);
      
      if (!surahData) {
        console.error(`✗ Failed to fetch Surah ${surahId}`);
        errorCount++;
        continue;
      }
      
      // Prepare ayah records for insertion - match Arabic with English
      const ayahRecords = surahData.arabic.ayahs.map((arabicAyah, index) => {
        const englishAyah = surahData.english.ayahs[index];
        return {
          surahId,
          number: arabicAyah.numberInSurah,
          text: arabicAyah.text,
          translation: englishAyah.text,
        };
      });
      
      // Insert ayahs into database
      await db.insert(ayahs).values(ayahRecords);
      
      totalAyahs += ayahRecords.length;
      successCount++;
      console.log(`✓ Surah ${surahId}: Inserted ${ayahRecords.length} ayahs`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`✗ Error processing Surah ${surahId}:`, error);
      errorCount++;
    }
  }
  
  console.log("\n=== Population Complete ===");
  console.log(`Total surahs processed: ${successCount + errorCount}`);
  console.log(`Successfully populated: ${successCount} surahs`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total ayahs inserted: ${totalAyahs}`);
}

// Run the population script
populateAyahs()
  .then(() => {
    console.log("\nScript completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed with error:", error);
    process.exit(1);
  });
