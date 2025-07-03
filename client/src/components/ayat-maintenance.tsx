import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  BookOpen, 
  Database, 
  RefreshCw, 
  Download, 
  Upload,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Surah, Ayah } from "@shared/schema";

interface AyatMaintenanceProps {
  onClose?: () => void;
}

export const AyatMaintenance = ({ onClose }: AyatMaintenanceProps) => {
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAyah, setEditingAyah] = useState<Ayah | null>(null);
  const queryClient = useQueryClient();

  // Fetch all surahs
  const { data: surahs = [], isLoading: surahsLoading } = useQuery<Surah[]>({
    queryKey: ["/api/surahs"],
  });

  // Fetch ayahs for selected surah
  const { data: ayahs = [], isLoading: ayahsLoading, refetch: refetchAyahs } = useQuery<Ayah[]>({
    queryKey: ["/api/surahs", selectedSurah, "ayahs"],
    enabled: !!selectedSurah,
  });

  // Mutation for updating ayah
  const updateAyahMutation = useMutation({
    mutationFn: async (ayah: Partial<Ayah> & { surahId: number; number: number }) => {
      return await apiRequest(`/api/surahs/${ayah.surahId}/ayahs/${ayah.number}`, {
        method: "PUT",
        body: JSON.stringify(ayah),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surahs", selectedSurah, "ayahs"] });
      setEditingAyah(null);
    },
  });

  // Mutation for refreshing ayah data from API
  const refreshDataMutation = useMutation({
    mutationFn: async (surahId: number) => {
      return await apiRequest(`/api/surahs/${surahId}/refresh`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      refetchAyahs();
    },
  });

  const filteredAyahs = ayahs.filter(ayah => 
    ayah.text.includes(searchTerm) || 
    ayah.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ayah.number.toString().includes(searchTerm)
  );

  const handleEditAyah = (ayah: Ayah) => {
    setEditingAyah({ ...ayah });
  };

  const handleSaveAyah = () => {
    if (editingAyah) {
      updateAyahMutation.mutate(editingAyah);
    }
  };

  const handleRefreshData = () => {
    refreshDataMutation.mutate(selectedSurah);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-islamic-light via-white to-islamic-light/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-islamic-green/10">
              <Database className="h-6 w-6 text-islamic-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ayat Maintenance</h1>
              <p className="text-gray-600">Manage and maintain Quran verses data</p>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse & Edit</TabsTrigger>
            <TabsTrigger value="search">Search & Filter</TabsTrigger>
            <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Surah Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Select value={selectedSurah.toString()} onValueChange={(value) => setSelectedSurah(parseInt(value))}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a Surah" />
                    </SelectTrigger>
                    <SelectContent>
                      {surahs.map((surah) => (
                        <SelectItem key={surah.id} value={surah.id.toString()}>
                          {surah.id}. {surah.name} ({surah.nameArabic})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleRefreshData} disabled={refreshDataMutation.isPending}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                  
                  <Badge variant="outline">
                    {ayahs.length} verses
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Ayahs List */}
            <div className="grid gap-4">
              {ayahsLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-islamic-green" />
                    Loading verses...
                  </CardContent>
                </Card>
              ) : (
                filteredAyahs.map((ayah) => (
                  <Card key={ayah.number} className="transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-islamic-green text-white">
                          Verse {ayah.number}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAyah(ayah)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Arabic Text</h4>
                          <p className="text-xl font-amiri leading-relaxed text-right">
                            {ayah.text}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">English Translation</h4>
                          <p className="text-gray-800 leading-relaxed">
                            {ayah.translation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter Verses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search Arabic text, translation, or verse number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    Advanced Search
                  </Button>
                </div>
                
                {searchTerm && (
                  <div className="mt-4">
                    <Badge variant="outline">
                      {filteredAyahs.length} results found
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Al-Quran Cloud API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Primary source for authentic Arabic text and English translations.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Arabic Text:</span>
                      <Badge variant="outline">ar.asad</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Translation:</span>
                      <Badge variant="outline">en.sahih</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Local Data Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Cached data for offline access and faster loading.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Surahs Cached:</span>
                      <Badge variant="outline">{surahs.length}/114</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <Badge variant="outline">Today</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Export current verse data for backup purposes.
                  </p>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Import</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Import verse data from external sources.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Check synchronization with external APIs.
                  </p>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Sync
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {editingAyah && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Verse {editingAyah.number}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Arabic Text</label>
                  <Textarea
                    value={editingAyah.text}
                    onChange={(e) => setEditingAyah({ ...editingAyah, text: e.target.value })}
                    className="font-amiri text-right text-lg"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">English Translation</label>
                  <Textarea
                    value={editingAyah.translation}
                    onChange={(e) => setEditingAyah({ ...editingAyah, translation: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingAyah(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAyah}
                    disabled={updateAyahMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAyahMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};