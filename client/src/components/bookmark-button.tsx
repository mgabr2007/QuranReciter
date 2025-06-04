import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookmarkDialog } from "@/components/bookmark-dialog";
import type { Ayah, BookmarkedAyah } from "@shared/schema";

interface BookmarkButtonProps {
  ayah: Ayah;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export const BookmarkButton = ({ 
  ayah, 
  onBookmarkChange 
}: BookmarkButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all bookmarks to check if current ayah is bookmarked
  const { data: bookmarks = [] } = useQuery<BookmarkedAyah[]>({
    queryKey: ["/api/bookmarks"],
  });

  // Check if current ayah is bookmarked
  const isBookmarked = useMemo(() => {
    return bookmarks.some(
      bookmark => bookmark.surahId === ayah.surahId && bookmark.ayahNumber === ayah.number
    );
  }, [bookmarks, ayah.surahId, ayah.number]);

  const addBookmarkMutation = useMutation({
    mutationFn: (data: {
      surahId: number;
      ayahNumber: number;
      notes?: string;
    }) => apiRequest("POST", "/api/bookmarks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      onBookmarkChange?.(true);
      toast({
        title: "Verse bookmarked",
        description: "Added to your favorite verses collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to bookmark",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: number) => 
      apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      onBookmarkChange?.(false);
      toast({
        title: "Bookmark removed",
        description: "Removed from your favorite verses",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove bookmark",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleBookmarkToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isBookmarked) {
        // Find the bookmark ID from the current bookmarks
        const bookmarks = queryClient.getQueryData(["/api/bookmarks"]) as any[];
        const bookmark = bookmarks?.find(
          b => b.surahId === ayah.surahId && b.ayahNumber === ayah.number
        );
        
        if (bookmark) {
          await removeBookmarkMutation.mutateAsync(bookmark.id);
        }
      } else {
        await addBookmarkMutation.mutateAsync({
          surahId: ayah.surahId,
          ayahNumber: ayah.number,
          notes: `Bookmarked verse ${ayah.number} from Surah ${ayah.surahId}`,
        });
      }
    } catch (error) {
      console.error("Bookmark operation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isBookmarked) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className="bg-islamic-green hover:bg-islamic-green/90 text-white transition-colors duration-200"
      >
        <HeartHandshake className="h-4 w-4 mr-1" />
        {isLoading ? "Removing..." : "Bookmarked"}
      </Button>
    );
  }

  return (
    <BookmarkDialog ayah={ayah} isBookmarked={false}>
      <Button
        variant="outline"
        size="sm"
        className="border-islamic-green text-islamic-green hover:bg-islamic-light transition-colors duration-200"
      >
        <Heart className="h-4 w-4 mr-1" />
        Bookmark
      </Button>
    </BookmarkDialog>
  );
};