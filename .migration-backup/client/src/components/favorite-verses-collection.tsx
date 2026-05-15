import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Heart, Play, Edit, Trash2, Tag, Calendar, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookmarkedAyah, Surah } from "@shared/schema";

// Extended type to include ayah text and translation from backend join
type BookmarkedAyahWithText = BookmarkedAyah & {
  text: string;
  translation: string;
};

interface FavoriteVersesCollectionProps {
  onPlayVerse?: (surahId: number, ayahNumber: number) => void;
}

type SortOption = "recent" | "oldest" | "surah" | "rating";

export const FavoriteVersesCollection = ({ onPlayVerse }: FavoriteVersesCollectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load bookmarks
  const { data: bookmarks = [], isLoading } = useQuery<BookmarkedAyahWithText[]>({
    queryKey: ["/api/bookmarks"],
  });

  // Load surahs for reference
  const { data: surahs = [] } = useQuery<Surah[]>({
    queryKey: ["/api/surahs"],
  });

  // Star/favorite a bookmark
  const toggleFavoriteMutation = useMutation({
    mutationFn: (data: { bookmarkId: number; isFavorite: boolean }) =>
      apiRequest("PATCH", `/api/bookmarks/${data.bookmarkId}`, {
        isFavorite: data.isFavorite,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Updated favorite status",
        description: "Verse favorite status has been updated",
      });
    },
  });

  // Rate a bookmark
  const rateBookmarkMutation = useMutation({
    mutationFn: (data: { bookmarkId: number; rating: number }) =>
      apiRequest("PATCH", `/api/bookmarks/${data.bookmarkId}`, {
        rating: data.rating,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Rating updated",
        description: "Verse rating has been saved",
      });
    },
  });

  // Delete bookmark
  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: number) =>
      apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark deleted",
        description: "Verse has been removed from bookmarks",
      });
    },
  });

  // Get surah name helper
  const getSurahName = (surahId: number) => {
    const surah = surahs.find(s => s.id === surahId);
    return surah ? surah.name : `Surah ${surahId}`;
  };

  // Extract unique tags from bookmarks
  const allTags = Array.from(
    new Set(
      bookmarks
        .flatMap(bookmark => bookmark.tags ? bookmark.tags.split(',') : [])
        .filter(Boolean)
    )
  );

  // Filter and sort bookmarks
  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const surahName = getSurahName(bookmark.surahId).toLowerCase();
        const notes = (bookmark.notes || '').toLowerCase();
        const tags = (bookmark.tags || '').toLowerCase();
        
        if (!surahName.includes(query) && !notes.includes(query) && !tags.includes(query)) {
          return false;
        }
      }
      
      // Tag filter
      if (selectedTag && (!bookmark.tags || !bookmark.tags.includes(selectedTag))) {
        return false;
      }
      
      // Favorite filter
      if (favoriteFilter !== null && Boolean(bookmark.isFavorite) !== favoriteFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "surah":
          if (a.surahId !== b.surahId) return a.surahId - b.surahId;
          return a.ayahNumber - b.ayahNumber;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  const renderStarRating = (bookmark: BookmarkedAyah) => {
    const rating = bookmark.rating || 0;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => rateBookmarkMutation.mutate({
              bookmarkId: bookmark.id,
              rating: star === rating ? 0 : star
            })}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your favorite verses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Favorite Verses Collection</h2>
          <p className="text-gray-600">{bookmarks.length} verses bookmarked</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search verses, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:col-span-2"
            />
            
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="surah">By Surah</SelectItem>
                <SelectItem value="rating">By Rating</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={favoriteFilter === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoriteFilter(favoriteFilter === true ? null : true)}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Favorites Only
            </Button>
            
            <Button
              variant={favoriteFilter === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFavoriteFilter(favoriteFilter === false ? null : false)}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Regular Bookmarks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No verses found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getSurahName(bookmark.surahId)} : {bookmark.ayahNumber}
                    </Badge>
                    {bookmark.isFavorite && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPlayVerse?.(bookmark.surahId, bookmark.ayahNumber)}
                      className="h-8 w-8 p-0"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavoriteMutation.mutate({
                        bookmarkId: bookmark.id,
                        isFavorite: !bookmark.isFavorite
                      })}
                      className="h-8 w-8 p-0"
                    >
                      <Star className={`h-4 w-4 ${bookmark.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Arabic Text */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 mt-3">
                  <p 
                    className="text-lg leading-loose font-arabic text-gray-900 dark:text-white text-center"
                    style={{ fontFamily: "'Amiri Quran', 'Arabic Typesetting', serif", lineHeight: 1.8 }}
                    dir="rtl"
                  >
                    {bookmark.text}
                  </p>
                </div>
                
                {/* English Translation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {bookmark.translation}
                  </p>
                </div>

                {bookmark.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3 border border-yellow-100 dark:border-yellow-800">
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      📝 Your Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {bookmark.notes}
                    </p>
                  </div>
                )}

                {bookmark.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bookmark.tags.split(',').filter(Boolean).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </div>
                  
                  {renderStarRating(bookmark)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};