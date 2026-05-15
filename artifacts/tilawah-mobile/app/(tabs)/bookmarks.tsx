import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Bookmark {
  id: number;
  surahId: number;
  ayahNumber: number;
  surahName: string;
  ayahText: string;
  translation?: string;
  notes?: string | null;
  createdAt: string;
}

export default function BookmarksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { user, baseUrl } = useAuth();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/bookmarks`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [user, baseUrl]);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  const deleteBookmark = async (id: number) => {
    Alert.alert(t("deleteBookmark"), t("confirmDelete"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${baseUrl}/api/bookmarks/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
          } catch {}
        },
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const renderItem = ({ item }: { item: Bookmark }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      {/* Surah badge row */}
      <View style={styles.cardTop}>
        <View style={styles.surahBadgeRow}>
          <View
            style={[
              styles.surahBadge,
              { backgroundColor: colors.islamicGreen + "22" },
            ]}
          >
            <Text style={[styles.surahBadgeText, { color: colors.islamicGreen }]}>
              {item.surahName} · {t("ayahNumber")} {item.ayahNumber}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => deleteBookmark(item.id)}
          style={styles.deleteBtn}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={17} color={colors.destructive} />
        </Pressable>
      </View>

      {/* Arabic text */}
      <Text
        style={[
          styles.arabicText,
          { color: colors.foreground },
        ]}
        numberOfLines={3}
      >
        {item.ayahText}
      </Text>

      {/* Translation */}
      {item.translation ? (
        <Text
          style={[styles.translationText, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.translation}
        </Text>
      ) : null}

      {/* Notes */}
      {item.notes ? (
        <View
          style={[
            styles.notesBox,
            { backgroundColor: colors.islamicAccent + "18", borderRadius: 8 },
          ]}
        >
          <Ionicons name="document-text-outline" size={13} color={colors.islamicAccent} />
          <Text style={[styles.notesText, { color: colors.foreground }]}>
            {item.notes}
          </Text>
        </View>
      ) : null}

      {/* Date */}
      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!user ? (
        <View style={[styles.authPrompt, { paddingTop: topPad + 40 }]}>
          <Ionicons name="bookmark-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            {t("myBookmarks")}
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
            {t("signInToAccount")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: topPad + 8,
            paddingBottom: botPad,
            paddingHorizontal: 16,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadBookmarks}
              tintColor={colors.islamicGreen}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>
                {t("myBookmarks")}
              </Text>
              {bookmarks.length > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: colors.islamicGreen + "22" },
                  ]}
                >
                  <Text style={[styles.countText, { color: colors.islamicGreen }]}>
                    {bookmarks.length}
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons
                  name="bookmark-outline"
                  size={56}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {t("noBookmarks")}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  {t("startBookmarking")}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  screenTitle: { fontSize: 26, fontWeight: "700" as const },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: "700" as const },
  card: {
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  surahBadgeRow: { flex: 1 },
  surahBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  surahBadgeText: { fontSize: 12, fontWeight: "600" as const },
  deleteBtn: { padding: 4 },
  arabicText: {
    fontSize: 22,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 44,
    fontFamily: "AmiriQuran",
  },
  translationText: {
    fontSize: 13,
    lineHeight: 20,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    gap: 6,
  },
  notesText: { fontSize: 13, flex: 1, lineHeight: 18 },
  dateText: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  authTitle: { fontSize: 22, fontWeight: "700" as const },
  authSubtitle: { fontSize: 15, textAlign: "center" },
});
