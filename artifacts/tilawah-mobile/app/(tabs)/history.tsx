import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Session {
  id: number;
  surahId: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  completedAyahs: number;
  sessionTime: number;
  isCompleted: boolean;
  createdAt: string;
}

interface Stats {
  totalSessions: number;
  totalAyahs: number;
  totalTime: number;
  avgSessionTime: number;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { user, baseUrl } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/sessions`, { credentials: "include" }),
        fetch(`${baseUrl}/api/sessions/stats`, { credentials: "include" }),
      ]);
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data ?? []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, [user, baseUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const renderSession = ({ item }: { item: Session }) => (
    <View
      style={[
        styles.sessionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.sessionHeader}>
        <View
          style={[
            styles.surahIcon,
            { backgroundColor: colors.islamicGreen + "22" },
          ]}
        >
          <Text style={[styles.surahIconText, { color: colors.islamicGreen }]}>
            {item.surahId}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionName, { color: colors.foreground }]}>
            {item.surahName}
          </Text>
          <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
            {t("ayahNumber")} {item.startAyah}–{item.endAyah}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.isCompleted
                ? colors.islamicGreen + "22"
                : colors.islamicAccent + "22",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.isCompleted
                  ? colors.islamicGreen
                  : colors.islamicAccent,
              },
            ]}
          >
            {item.isCompleted ? t("completed") : t("inProgress")}
          </Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="musical-notes-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statItemText, { color: colors.mutedForeground }]}>
            {item.completedAyahs} {t("ayahs")}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statItemText, { color: colors.mutedForeground }]}>
            {formatTime(item.sessionTime)}
          </Text>
        </View>
        <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const statsData = [
    {
      icon: "layers-outline" as const,
      value: stats?.totalSessions ?? 0,
      label: t("totalSessions"),
    },
    {
      icon: "musical-note-outline" as const,
      value: stats?.totalAyahs ?? 0,
      label: t("totalAyahs"),
    },
    {
      icon: "time-outline" as const,
      value: stats?.totalTime ? formatTime(stats.totalTime) : "0s",
      label: t("totalTime"),
    },
    {
      icon: "trending-up-outline" as const,
      value: stats?.avgSessionTime ? formatTime(stats.avgSessionTime) : "0s",
      label: t("avgSessionTime"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!user ? (
        <View style={[styles.authPrompt, { paddingTop: topPad + 40 }]}>
          <Ionicons name="time-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            {t("listeningHistory")}
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
            {t("signInToAccount")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSession}
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
              onRefresh={loadData}
              tintColor={colors.islamicGreen}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>
                {t("listeningHistory")}
              </Text>

              {/* Stats grid */}
              {stats && (
                <View
                  style={[
                    styles.statsGrid,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  {statsData.map((s, i) => (
                    <View
                      key={i}
                      style={[
                        styles.statGridItem,
                        i % 2 === 0 && {
                          borderRightWidth: StyleSheet.hairlineWidth,
                          borderRightColor: colors.border,
                        },
                        i < 2 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={s.icon}
                        size={20}
                        color={colors.islamicGreen}
                      />
                      <Text
                        style={[styles.statGridValue, { color: colors.foreground }]}
                      >
                        {s.value}
                      </Text>
                      <Text
                        style={[
                          styles.statGridLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons
                  name="time-outline"
                  size={56}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {t("noHistory")}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  {t("startListening")}
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
  listHeader: { gap: 16, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: "700" as const },
  statsGrid: {
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statGridItem: {
    width: "50%",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statGridValue: { fontSize: 22, fontWeight: "700" as const },
  statGridLabel: { fontSize: 11 },
  sessionCard: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  surahIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  surahIconText: { fontSize: 14, fontWeight: "700" as const },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 15, fontWeight: "600" as const },
  sessionMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: "600" as const },
  sessionStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statItemText: { fontSize: 12 },
  sessionDate: { fontSize: 11, marginLeft: "auto" },
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
