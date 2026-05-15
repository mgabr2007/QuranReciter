import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Book, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Breadcrumb } from "@/components/breadcrumb";
import { Link } from "wouter";

interface SearchResult {
  id: number;
  surahId: number;
  number: number;
  text: string;
  translation: string;
  surahName: string;
  surahNameArabic: string;
}

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  
  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      : part
  );
}

export default function Search() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results from backend using debounced query
  const { data: searchResults = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", debouncedQuery],
    enabled: debouncedQuery.length >= 3,
  });

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
      ) : isLoading ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-lg">
              {isArabic ? "جاري البحث..." : "Searching..."}
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
          <p className="text-sm text-muted-foreground mb-4">
            {isArabic 
              ? `تم العثور على ${searchResults.length} نتيجة` 
              : `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
            }
          </p>
          {searchResults.map((result) => (
            <Link key={result.id} href={`/recite?surah=${result.surahId}&ayah=${result.number}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`search-result-${result.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {isArabic ? result.surahNameArabic : result.surahName}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {isArabic ? `آية ${result.number}` : `Ayah ${result.number}`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-right font-arabic text-xl leading-relaxed" dir="rtl">
                    {highlightMatch(result.text, searchQuery)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed border-t pt-3">
                    {highlightMatch(result.translation, searchQuery)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
