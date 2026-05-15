import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface Community {
  id: number;
  name: string;
  description: string | null;
  adminId: number;
  maxMembers: number;
  createdAt: string;
}

interface MyCommunity extends Community {
  memberCount: number;
  juzNumber: number | null;
}

type Tab = "browse" | "mine";

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { user, baseUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const apiFetch = useCallback(
    async (path: string, options?: RequestInit) => {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json();
    },
    [baseUrl]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allData, myData] = await Promise.all([
        apiFetch("/api/communities"),
        user ? apiFetch("/api/my-communities") : Promise.resolve([]),
      ]);
      setCommunities(allData ?? []);
      setMyCommunities(myData ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [apiFetch, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const isMember = (id: number) => myCommunities.some((c) => c.id === id);

  const handleJoin = async (communityId: number) => {
    if (!user) {
      Alert.alert("", t("signInToAccount"));
      return;
    }
    setJoiningId(communityId);
    try {
      const data = await apiFetch(`/api/communities/${communityId}/join`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const juz = data?.assignment?.juzNumber;
      Alert.alert(
        t("success"),
        juz ? `${t("yourJuz")}: ${juz}` : t("joined")
      );
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("error");
      Alert.alert(t("error"), msg);
    } finally {
      setJoiningId(null);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const renderCommunity = ({ item }: { item: Community }) => {
    const member = isMember(item.id);
    const myC = myCommunities.find((c) => c.id === item.id);

    return (
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
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.islamicGreen + "22" },
            ]}
          >
            <Ionicons name="people" size={22} color={colors.islamicGreen} />
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.communityName,
                { color: colors.foreground },
                isRTL && styles.rtlText,
              ]}
            >
              {item.name}
            </Text>
            {item.description ? (
              <Text
                style={[
                  styles.communityDesc,
                  { color: colors.mutedForeground },
                  isRTL && styles.rtlText,
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaBadge}>
            <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.maxMembers} {t("maxMembers")}
            </Text>
          </View>

          {member && myC?.juzNumber ? (
            <View
              style={[
                styles.juzBadge,
                { backgroundColor: colors.islamicGreen + "22" },
              ]}
            >
              <Text style={[styles.juzBadgeText, { color: colors.islamicGreen }]}>
                {t("yourJuz")} {myC.juzNumber}
              </Text>
            </View>
          ) : null}

          {user && (
            <Pressable
              onPress={() => !member && handleJoin(item.id)}
              disabled={member || joiningId === item.id}
              style={({ pressed }) => [
                styles.joinBtn,
                {
                  backgroundColor: member
                    ? colors.muted
                    : colors.islamicGreen,
                  borderRadius: colors.radius - 4,
                  opacity: pressed && !member ? 0.85 : 1,
                },
              ]}
            >
              {joiningId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.joinBtnText,
                    { color: member ? colors.mutedForeground : "#FFFFFF" },
                  ]}
                >
                  {member ? t("alreadyMember") : t("joinCommunity")}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderMyCommunity = ({ item }: { item: MyCommunity }) => (
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
      <LinearGradient
        colors={[colors.islamicGreen + "33", "transparent"]}
        style={styles.myCardGradient}
      />
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.islamicGreen + "33" },
          ]}
        >
          <Ionicons name="book" size={22} color={colors.islamicGreen} />
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[
              styles.communityName,
              { color: colors.foreground },
              isRTL && styles.rtlText,
            ]}
          >
            {item.name}
          </Text>
          {item.description ? (
            <Text
              style={[
                styles.communityDesc,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statBox,
            { backgroundColor: colors.islamicGreen + "18" },
          ]}
        >
          <Text style={[styles.statValue, { color: colors.islamicGreen }]}>
            {item.juzNumber ?? "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {t("yourJuz")}
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {item.memberCount}/{item.maxMembers}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {t("members")}
          </Text>
        </View>
      </View>
    </View>
  );

  const displayData = activeTab === "browse" ? communities : myCommunities;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayData as any[]}
        keyExtractor={(item) => String(item.id)}
        renderItem={activeTab === "browse" ? renderCommunity : renderMyCommunity}
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
              {t("communities")}
            </Text>
            {/* Tabs */}
            <View
              style={[
                styles.tabBar,
                { backgroundColor: colors.muted, borderRadius: colors.radius },
              ]}
            >
              {(["browse", "mine"] as Tab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabBtn,
                    activeTab === tab && {
                      backgroundColor: colors.islamicGreen,
                    },
                    { borderRadius: colors.radius - 4 },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === tab ? "#FFFFFF" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {tab === "browse" ? t("browseAll") : t("myCommunitiesTab")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons
                name="people-outline"
                size={56}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t("noCommunitiesYet")}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: { gap: 14, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: "700" as const },
  tabBar: {
    flexDirection: "row",
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "600" as const },
  card: {
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    gap: 12,
  },
  myCardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 60,
  },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  communityName: { fontSize: 16, fontWeight: "600" as const },
  communityDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  juzBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  juzBadgeText: { fontSize: 12, fontWeight: "600" as const },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  joinBtnText: { fontSize: 13, fontWeight: "600" as const },
  statsGrid: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700" as const },
  statLabel: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  rtlText: { textAlign: "right", writingDirection: "rtl" },
});
