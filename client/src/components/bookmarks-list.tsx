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

  const { data: bookmarks = [], isLoading } = useQuery<BookmarkedAyah[]>({
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

  const handleDelete = async (bookmarkId: number) => {
    setDeletingId(bookmarkId);
    await deleteBookmarkMutation.mutateAsync(bookmarkId);
  };

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
          Bookmarked Verses ({bookmarks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {getSurahName(bookmark.surahId)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Verse {bookmark.ayahNumber}
                      </Badge>
                    </div>
                    
                    {bookmark.notes && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {bookmark.notes}
                      </p>
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
      </CardContent>
    </Card>
  );
};