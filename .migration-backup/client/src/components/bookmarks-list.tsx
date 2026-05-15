import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Play, BookOpen, Heart, Search, MessageCircle, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookmarkedAyah, Surah } from "@shared/schema";

// Extended type to include ayah text and translation from backend join
type BookmarkedAyahWithText = BookmarkedAyah & {
  text: string;
  translation: string;
};

interface BookmarksListProps {
  onPlayAyah?: (surahId: number, ayahNumber: number) => void;
}

export const BookmarksList = ({ onPlayAyah }: BookmarksListProps) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<BookmarkedAyah | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery<BookmarkedAyahWithText[]>({
    queryKey: ["/api/bookmarks"],
  });

  const { data: surahs = [] } = useQuery<Surah[]>({
    queryKey: ["/api/surahs"],
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: number) => 
      apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark removed",
        description: "Verse removed from your favorites",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove bookmark",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => 
      apiRequest("PATCH", `/api/bookmarks/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setEditingBookmark(null);
      setEditNotes("");
      toast({
        title: "Notes updated",
        description: "Your bookmark notes have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update notes",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (bookmarkId: number) => {
    setDeletingId(bookmarkId);
    await deleteBookmarkMutation.mutateAsync(bookmarkId);
  };

  const handleEditNotes = (bookmark: BookmarkedAyah) => {
    setEditingBookmark(bookmark);
    setEditNotes(bookmark.notes || "");
  };

  const handleSaveNotes = () => {
    if (editingBookmark) {
      updateBookmarkMutation.mutate({
        id: editingBookmark.id,
        notes: editNotes,
      });
    }
  };

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const surahName = getSurahName(bookmark.surahId).toLowerCase();
    const notes = (bookmark.notes || "").toLowerCase();
    const ayahRef = `ayah ${bookmark.ayahNumber}`.toLowerCase();
    
    return surahName.includes(searchLower) || 
           notes.includes(searchLower) || 
           ayahRef.includes(searchLower);
  });

  const getSurahName = (surahId: number) => {
    const surah = surahs.find(s => s.id === surahId);
    return surah ? `${surah.name} (${surah.nameArabic})` : `Surah ${surahId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-islamic-green" />
            Bookmarked Verses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-islamic-green" />
            Bookmarked Verses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No bookmarked verses yet</p>
            <p className="text-sm text-gray-500">
              Bookmark your favorite verses during recitation practice
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-islamic-green" />
          Bookmarked Verses ({filteredBookmarks.length}{bookmarks.length !== filteredBookmarks.length ? ` of ${bookmarks.length}` : ''})
        </CardTitle>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookmarks by surah, verse, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookmarks.length === 0 && searchQuery ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No bookmarks found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {getSurahName(bookmark.surahId)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Verse {bookmark.ayahNumber}
                      </Badge>
                    </div>
                    
                    {/* Arabic Text */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <p 
                        className="text-xl leading-loose font-arabic text-gray-900 dark:text-white text-center"
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
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-2 border border-yellow-100 dark:border-yellow-800">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          📝 Your Notes:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {bookmark.notes}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Bookmarked on {formatDate(bookmark.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {onPlayAyah && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPlayAyah(bookmark.surahId, bookmark.ayahNumber)}
                        className="text-islamic-green hover:text-islamic-green hover:bg-islamic-light"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(bookmark)}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-islamic-green" />
                            Edit Bookmark Notes
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {getSurahName(bookmark.surahId)} - Verse {bookmark.ayahNumber}
                            </p>
                          </div>
                          
                          <Textarea
                            placeholder="Add your thoughts, reflections, or reminders about this verse..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            onClick={handleSaveNotes}
                            disabled={updateBookmarkMutation.isPending}
                            className="bg-islamic-green hover:bg-islamic-green/90"
                          >
                            {updateBookmarkMutation.isPending ? "Saving..." : "Save Notes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bookmark.id)}
                      disabled={deletingId === bookmark.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};