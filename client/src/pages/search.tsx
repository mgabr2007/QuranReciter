import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Book } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Breadcrumb } from "@/components/breadcrumb";

interface Ayah {
  id: number;
  surahId: number;
  number: number;
  text: string;
  translationEn?: string;
}

interface Surah {
  id: number;
  name: string;
  nameArabic: string;
}

export default function Search() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");

  const { data: surahs } = useQuery<Surah[]>({ queryKey: ["/api/surahs"] });

  // Simplified search - you can enhance this with backend search
  const searchResults = searchQuery.length >= 3 ? [] : [];

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Breadcrumb items={[
        { label: isArabic ? "الرئيسية" : "Home", href: "/" },
        { label: isArabic ? "بحث" : "Search" }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="search-title">
          {isArabic ? "البحث في القرآن" : "Search the Quran"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic ? "ابحث عن الآيات والسور" : "Search for verses and surahs"}
        </p>
      </div>

      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder={isArabic ? "ابحث عن آية أو سورة..." : "Search for a verse or surah..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-lg h-12"
          data-testid="input-search"
        />
      </div>

      {searchQuery.length < 3 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {isArabic ? "أدخل 3 أحرف على الأقل للبحث" : "Enter at least 3 characters to search"}
            </p>
          </CardContent>
        </Card>
      ) : searchResults.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {isArabic ? "لم يتم العثور على نتائج" : "No results found"}
            </p>
            <p className="text-sm mt-2">
              {isArabic ? "جرب كلمات مفتاحية مختلفة" : "Try different keywords"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {searchResults.map((result: any, index: number) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Result {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Search result content</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
