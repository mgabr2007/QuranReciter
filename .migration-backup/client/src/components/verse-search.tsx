import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Ayah, Surah } from "@shared/schema";

interface VerseSearchProps {
  onPlayVerse?: (surahId: number, ayahNumber: number) => void;
  onClose?: () => void;
}

interface SearchResult {
  ayah: Ayah;
  surah: Surah;
  highlightedText: string;
  highlightedTranslation: string;
  relevanceScore: number;
}

// Highlight matching keywords in text
const highlightText = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) return text;
  
  const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  let highlightedText = text;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  });
  
  return highlightedText;
};

// Calculate relevance score for search results
const calculateRelevance = (ayah: Ayah, searchQuery: string): number => {
  const query = searchQuery.toLowerCase();
  const keywords = query.split(/\s+/).filter(Boolean);
  let score = 0;
  
  keywords.forEach(keyword => {
    const arabicMatches = (ayah.text?.toLowerCase() || '').split(keyword).length - 1;
    const translationMatches = (ayah.translation?.toLowerCase() || '').split(keyword).length - 1;
    
    score += arabicMatches * 2; // Arabic text weighted higher
    score += translationMatches * 1;
  });
  
  return score;
};

export const VerseSearch = ({ onPlayVerse, onClose }: VerseSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all surahs for search
  const { data: surahs = [] } = useQuery<Surah[]>({
    queryKey: ["/api/surahs"],
  });

  // Fetch all ayahs for comprehensive search
  const { data: allAyahs = [] } = useQuery({
    queryKey: ["/api/search/ayahs"],
    enabled: searchQuery.length > 2,
  });

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const performSearch = async () => {
      try {
        // Get ayahs from all surahs for comprehensive search
        const allResults: SearchResult[] = [];
        
        for (const surah of surahs as Surah[]) {
          const response = await fetch(`/api/surahs/${surah.id}/ayahs`);
          if (response.ok) {
            const ayahs: Ayah[] = await response.json();
            
            ayahs.forEach(ayah => {
              const relevanceScore = calculateRelevance(ayah, searchQuery);
              
              if (relevanceScore > 0) {
                allResults.push({
                  ayah,
                  surah,
                  highlightedText: highlightText(ayah.text || '', searchQuery),
                  highlightedTranslation: highlightText(ayah.translation || '', searchQuery),
                  relevanceScore
                });
              }
            });
          }
        }
        
        // Sort by relevance score
        allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        setSearchResults(allResults.slice(0, 50)); // Limit to top 50 results
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, surahs]);

  const handlePlayVerse = (surahId: number, ayahNumber: number) => {
    onPlayVerse?.(surahId, ayahNumber);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-semibold">Search Quran Verses</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search verses in Arabic or English translation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-emerald-200 focus:border-emerald-500"
              autoFocus
            />
          </div>
          
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <div className="text-center text-gray-500 py-8">
              Please enter at least 3 characters to search
            </div>
          )}
          
          {isSearching && (
            <div className="text-center text-gray-500 py-8">
              Searching verses...
            </div>
          )}
          
          {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No verses found matching your search
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="mb-4">
              <Badge variant="secondary" className="text-sm">
                {searchResults.length} verses found
              </Badge>
            </div>
          )}
          
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card key={`${result.surah.id}-${result.ayah.number}`} className="border border-gray-200 dark:border-gray-700 hover:border-emerald-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.surah.name} {result.ayah.number}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Relevance: {result.relevanceScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayVerse(result.surah.id, result.ayah.number)}
                          className="h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Arabic Text */}
                    <div 
                      className="text-right text-xl leading-relaxed mb-3 font-arabic"
                      style={{ fontFamily: 'Amiri Quran, serif' }}
                      dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                    />
                    
                    <Separator className="my-3" />
                    
                    {/* English Translation */}
                    <div 
                      className="text-left text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: result.highlightedTranslation }}
                    />
                    
                    <div className="mt-3 text-xs text-gray-500">
                      {result.surah.nameArabic} - {result.surah.nameTranslation}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};