import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Heart, MessageCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Ayah } from "@shared/schema";

interface BookmarkDialogProps {
  ayah: Ayah;
  isBookmarked: boolean;
  children: React.ReactNode;
}

export const BookmarkDialog = ({ ayah, isBookmarked, children }: BookmarkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addBookmarkMutation = useMutation({
    mutationFn: (data: {
      surahId: number;
      ayahNumber: number;
      notes?: string;
    }) => apiRequest("POST", "/api/bookmarks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setOpen(false);
      setNotes("");
      setTags([]);
      toast({
        title: "Bookmark saved",
        description: "Verse added to your favorites with notes",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save bookmark",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveBookmark = () => {
    const bookmarkNotes = notes || `${ayah.text.substring(0, 100)}...`;
    const fullNotes = tags.length > 0 
      ? `${bookmarkNotes}\n\nTags: ${tags.join(", ")}`
      : bookmarkNotes;

    addBookmarkMutation.mutate({
      surahId: ayah.surahId,
      ayahNumber: ayah.number,
      notes: fullNotes,
    });
  };

  if (isBookmarked) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-islamic-green" />
            Bookmark Verse
          </DialogTitle>
          <DialogDescription>
            Save this verse to your favorites with personal notes and tags
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Verse Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Surah {ayah.surahId}, Ayah {ayah.number}
            </div>
            <div className="text-lg font-arabic leading-loose text-gray-900 dark:text-white mb-2">
              {ayah.text}
            </div>
            {ayah.translation && (
              <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                {ayah.translation}
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Personal Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add your thoughts, reflections, or reminders about this verse..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag (e.g., 'prayer', 'guidance', 'peace')"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
            
            {/* Display Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveBookmark}
            disabled={addBookmarkMutation.isPending}
            className="bg-islamic-green hover:bg-islamic-green/90"
          >
            {addBookmarkMutation.isPending ? "Saving..." : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Save Bookmark
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};