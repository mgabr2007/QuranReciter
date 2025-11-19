import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, BookOpen, Star, List } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { BookmarksList } from "@/components/bookmarks-list";
import { FavoriteVersesCollection } from "@/components/favorite-verses-collection";
import type { BookmarkedAyah } from "@shared/schema";

export default function Bookmarks() {
  const [viewMode, setViewMode] = useState<'list' | 'collection'>('list');
  
  const { data: bookmarks = [], isLoading } = useQuery<BookmarkedAyah[]>({
    queryKey: ["/api/bookmarks"],
  });

  const handlePlayAyah = (surahId: number, ayahNumber: number) => {
    // Navigate to home page with specific ayah selected
    window.location.href = `/?surah=${surahId}&ayah=${ayahNumber}`;
  };

  return (
    <>
      <Breadcrumb 
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Bookmarks" }
        ]}
      />
      
      <PageHeader
        leftContent={<BackButton variant="ghost" className="text-islamic-green hover:bg-islamic-light" />}
        icon={<Heart className="h-6 w-6 text-white" />}
        title="Bookmarked Verses"
        subtitle="Your collection of favorite Quran verses"
        maxWidth="7xl"
        actions={
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
              Simple View
            </Button>
            <Button
              variant={viewMode === 'collection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('collection')}
              className="flex items-center gap-2"
              data-testid="button-view-collection"
            >
              <Star className="h-4 w-4" />
              Collection View
            </Button>
          </div>
        }
      />
      
      <PageLayout background="gradient" maxWidth="7xl">
        {/* Statistics */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            value={bookmarks.length} 
            label="Total Bookmarks" 
            data-testid="stat-total-bookmarks"
          />
          <StatCard 
            value={new Set(bookmarks.map(b => b.surahId)).size} 
            label="Unique Surahs"
            data-testid="stat-unique-surahs"
          />
          <StatCard 
            value={bookmarks.length > 0 
              ? new Date(Math.max(...bookmarks.map(b => new Date(b.createdAt).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '-'
            } 
            label="Latest Bookmark"
            data-testid="stat-latest-bookmark"
          />
        </div>
      )}

      {/* Dynamic Content Based on View Mode */}
      <div className="max-w-6xl mx-auto">
        {viewMode === 'list' ? (
          <BookmarksList onPlayAyah={handlePlayAyah} />
        ) : (
          <FavoriteVersesCollection onPlayVerse={handlePlayAyah} />
        )}
      </div>

      {/* Quick Actions */}
      {bookmarks.length > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
            <BookOpen className="h-4 w-4" />
            {viewMode === 'collection' 
              ? "Use filters and search to organize your verses. Star your favorites and rate them!"
              : "Click the play button next to any verse to start recitation from that point"
            }
          </div>
        </div>
      )}
      </PageLayout>
    </>
  );
}