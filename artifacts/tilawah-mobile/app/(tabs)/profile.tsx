import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { user, logout } = useAuth();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const handleLogout = () => {
    Alert.alert(t("signOut"), t("successfullyLoggedOut"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "language-outline" as const,
      label: `${t("language")}: ${language === "en" ? t("english") : t("arabic")}`,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleLanguage();
      },
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 8,
        paddingBottom: botPad,
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          {t("profile")}
        </Text>
      </View>

      {/* User Card */}
      {user ? (
        <LinearGradient
          colors={[colors.islamicDark, colors.islamicGreen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.userCard, { borderRadius: colors.radius }]}
        >
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <Text style={styles.avatarText}>
              {(user.displayName ?? user.username).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user.displayName ?? user.username}
          </Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
          {user.email ? (
            <Text style={styles.userEmail}>{user.email}</Text>
          ) : null}

          {/* Arabic blessing */}
          <Text style={styles.blessing}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
        </LinearGradient>
      ) : (
        <Pressable
          onPress={() => router.push("/login")}
          style={[
            styles.signInCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons name="person-circle-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.signInText, { color: colors.foreground }]}>
            {t("signIn")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      )}

      {/* Settings */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {menuItems.map((item, idx) => (
          <Pressable
            key={idx}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              {
                borderBottomColor: colors.border,
                borderBottomWidth:
                  idx < menuItems.length - 1 ? StyleSheet.hairlineWidth : 0,
                backgroundColor: pressed ? colors.muted : "transparent",
              },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.islamicGreen} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>
              {item.label}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>

      {/* App Info */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={20} color={colors.islamicGreen} />
          <Text style={[styles.menuLabel, { color: colors.foreground }]}>
            {t("appTitle")}
          </Text>
          <Text style={[styles.menuMeta, { color: colors.mutedForeground }]}>
            v1.0.0
          </Text>
        </View>
      </View>

      {/* Logout */}
      {user && (
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              backgroundColor: pressed ? colors.destructive + "22" : colors.card,
              borderColor: colors.destructive + "44",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {t("signOut")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center" },
  screenTitle: { fontSize: 26, fontWeight: "700" as const },
  userCard: {
    padding: 24,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  userHandle: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  blessing: {
    marginTop: 8,
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "AmiriQuran",
  },
  signInCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  signInText: { flex: 1, fontSize: 16, fontWeight: "600" as const },
  section: {
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  menuMeta: { fontSize: 13 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600" as const },
});
