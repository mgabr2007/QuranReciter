import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, BookOpen, Star, Grid, List } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookmarksList } from "@/components/bookmarks-list";
import { FavoriteVersesCollection } from "@/components/favorite-verses-collection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-to-br from-islamic-light via-white to-islamic-light/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-islamic-green hover:bg-islamic-light">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-islamic-green/10">
                <Heart className="h-6 w-6 text-islamic-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bookmarked Verses</h1>
                <p className="text-gray-600">Your collection of favorite Quran verses</p>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Simple View
            </Button>
            <Button
              variant={viewMode === 'collection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('collection')}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Collection View
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-islamic-green">
                  {bookmarks.length}
                </div>
                <div className="text-sm text-gray-600">Total Bookmarks</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-islamic-green">
                  {new Set(bookmarks.map(b => b.surahId)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Surahs</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-islamic-green">
                  {bookmarks.length > 0 
                    ? new Date(Math.max(...bookmarks.map(b => new Date(b.createdAt).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '-'
                  }
                </div>
                <div className="text-sm text-gray-600">Latest Bookmark</div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
}