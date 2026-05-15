import { db } from "./db";
import { surahs, ayahs } from "@shared/schema";
import { eq } from "drizzle-orm";

interface AlQuranCloudSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

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
    surahs?: AlQuranCloudSurah[];
    ayahs?: AlQuranCloudAyah[];
    number?: number;
    name?: string;
    englishName?: string;
    englishNameTranslation?: string;
    numberOfAyahs?: number;
    revelationType?: string;
  };
}

export class QuranDataScraper {
  private baseUrl = "https://api.alquran.cloud/v1";
  private delay = 1000; // 1 second delay between requests

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
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
        await this.sleep(this.delay * (i + 1)); // Exponential backoff
      }
    }
  }

  async scrapeSurahs(): Promise<void> {
    console.log("🕌 Starting Quran surahs scraping...");
    
    try {
      // Fetch all surahs metadata
      const response: AlQuranCloudResponse = await this.fetchWithRetry(
        `${this.baseUrl}/surah`
      );
      
      const surahsData = response.data.surahs;
      if (!surahsData) {
        throw new Error("No surahs data received");
      }

      console.log(`📖 Found ${surahsData.length} surahs to process`);

      // Insert or update surahs
      for (const surahData of surahsData) {
        try {
          // Check if surah already exists
          const existingSurah = await db
            .select()
            .from(surahs)
            .where(eq(surahs.id, surahData.number))
            .limit(1);

          if (existingSurah.length === 0) {
            await db.insert(surahs).values({
              id: surahData.number,
              name: surahData.englishName,
              nameArabic: surahData.name,
              nameTranslation: surahData.englishNameTranslation,
              totalAyahs: surahData.numberOfAyahs,
              revelation: surahData.revelationType === "Meccan" ? "Meccan" : "Medinan",
            });
            
            console.log(`✅ Added Surah ${surahData.number}: ${surahData.englishName}`);
          } else {
            console.log(`⏭️ Surah ${surahData.number} already exists, skipping`);
          }
        } catch (error) {
          console.error(`❌ Error processing Surah ${surahData.number}:`, error);
        }
      }

      console.log("🎉 Surahs scraping completed successfully!");
    } catch (error) {
      console.error("💥 Error scraping surahs:", error);
      throw error;
    }
  }

  async scrapeAyahs(): Promise<void> {
    console.log("📿 Starting Quran ayahs scraping...");
    
    try {
      // Get all surahs from database
      const allSurahs = await db.select().from(surahs).orderBy(surahs.id);
      
      console.log(`📚 Processing ${allSurahs.length} surahs for ayahs`);

      for (const surah of allSurahs) {
        console.log(`\n📖 Processing Surah ${surah.id}: ${surah.name}`);
        
        try {
          // Check if ayahs already exist for this surah
          const existingAyahs = await db
            .select()
            .from(ayahs)
            .where(eq(ayahs.surahId, surah.id))
            .limit(1);

          if (existingAyahs.length > 0) {
            console.log(`⏭️ Ayahs for Surah ${surah.id} already exist, skipping`);
            continue;
          }

          // Fetch Arabic text with meta data
          const arabicResponse: AlQuranCloudResponse = await this.fetchWithRetry(
            `${this.baseUrl}/surah/${surah.id}/ar.asad`
          );

          await this.sleep(this.delay);

          // Fetch English translation
          const englishResponse: AlQuranCloudResponse = await this.fetchWithRetry(
            `${this.baseUrl}/surah/${surah.id}/en.sahih`
          );

          await this.sleep(this.delay);

          // Fetch Uthmani text
          const uthmaniResponse: AlQuranCloudResponse = await this.fetchWithRetry(
            `${this.baseUrl}/surah/${surah.id}/ar.uthmani`
          );

          await this.sleep(this.delay);

          // Fetch alternative translations
          const pickthallResponse: AlQuranCloudResponse = await this.fetchWithRetry(
            `${this.baseUrl}/surah/${surah.id}/en.pickthall`
          );

          await this.sleep(this.delay);

          const yusufaliResponse: AlQuranCloudResponse = await this.fetchWithRetry(
            `${this.baseUrl}/surah/${surah.id}/en.yusufali`
          );

          await this.sleep(this.delay);

          const arabicAyahs = arabicResponse.data.ayahs;
          const englishAyahs = englishResponse.data.ayahs;
          const uthmaniAyahs = uthmaniResponse.data.ayahs;
          const pickthallAyahs = pickthallResponse.data.ayahs;
          const yusufaliAyahs = yusufaliResponse.data.ayahs;

          if (!arabicAyahs || !englishAyahs) {
            throw new Error(`Missing ayahs data for Surah ${surah.id}`);
          }

          console.log(`📝 Processing ${arabicAyahs.length} ayahs for Surah ${surah.id}`);

          // Process each ayah
          for (let i = 0; i < arabicAyahs.length; i++) {
            const arabicAyah = arabicAyahs[i];
            const englishAyah = englishAyahs[i];
            const uthmaniAyah = uthmaniAyahs?.[i];
            const pickthallAyah = pickthallAyahs?.[i];
            const yusufaliAyah = yusufaliAyahs?.[i];

            try {
              await db.insert(ayahs).values({
                surahId: surah.id,
                number: arabicAyah.numberInSurah,
                text: arabicAyah.text,
                translation: englishAyah.text,
                textUthmani: uthmaniAyah?.text || null,
                textSimple: arabicAyah.text, // Use primary Arabic as simple text
                translationSahih: englishAyah.text,
                translationPickthall: pickthallAyah?.text || null,
                translationYusufali: yusufaliAyah?.text || null,
                juz: arabicAyah.juz,
                manzil: arabicAyah.manzil,
                page: arabicAyah.page,
                ruku: arabicAyah.ruku,
                hizbQuarter: arabicAyah.hizbQuarter,
                sajda: typeof arabicAyah.sajda === 'boolean' ? arabicAyah.sajda : arabicAyah.sajda ? true : false,
              });

              if (i % 10 === 0) {
                console.log(`  📿 Processed ${i + 1}/${arabicAyahs.length} ayahs`);
              }
            } catch (error) {
              console.error(`❌ Error inserting ayah ${arabicAyah.numberInSurah} of Surah ${surah.id}:`, error);
            }
          }

          console.log(`✅ Completed Surah ${surah.id}: ${surah.name} (${arabicAyahs.length} ayahs)`);
        } catch (error) {
          console.error(`❌ Error processing Surah ${surah.id}:`, error);
        }
      }

      console.log("🎉 Ayahs scraping completed successfully!");
    } catch (error) {
      console.error("💥 Error scraping ayahs:", error);
      throw error;
    }
  }

  async scrapeAllData(): Promise<void> {
    console.log("🚀 Starting complete Quran data scraping...");
    
    try {
      await this.scrapeSurahs();
      await this.scrapeAyahs();
      
      // Get final statistics
      const surahCount = await db.select().from(surahs);
      const ayahCount = await db.select().from(ayahs);
      
      console.log("\n📊 Scraping Statistics:");
      console.log(`📖 Total Surahs: ${surahCount.length}`);
      console.log(`📿 Total Ayahs: ${ayahCount.length}`);
      console.log("🎉 Complete Quran database ready!");
      
    } catch (error) {
      console.error("💥 Error during complete scraping:", error);
      throw error;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new QuranDataScraper();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'surahs':
      scraper.scrapeSurahs().catch(console.error);
      break;
    case 'ayahs':
      scraper.scrapeAyahs().catch(console.error);
      break;
    case 'all':
    default:
      scraper.scrapeAllData().catch(console.error);
      break;
  }
}