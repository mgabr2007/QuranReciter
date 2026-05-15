import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t, isRTL } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message : t("invalidCredentials");
      Alert.alert(t("loginFailed"), msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.islamicDark, colors.islamicGreen, colors.islamicLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.iconText}>ق</Text>
            </View>
            <Text style={[styles.title, isRTL && styles.rtlText]}>
              {t("appTitle")}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
              {t("appSubtitle")}
            </Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: colors.foreground },
                isRTL && styles.rtlText,
              ]}
            >
              {t("signInToAccount")}
            </Text>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.mutedForeground },
                  isRTL && styles.rtlText,
                ]}
              >
                {t("username")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.foreground },
                    isRTL && styles.rtlText,
                  ]}
                  placeholder={t("enterUsername")}
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.mutedForeground },
                  isRTL && styles.rtlText,
                ]}
              >
                {t("password")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.foreground },
                    isRTL && styles.rtlText,
                  ]}
                  placeholder={t("enterPassword")}
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign={isRTL ? "right" : "left"}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                {
                  backgroundColor: colors.islamicGreen,
                  borderRadius: colors.radius - 4,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>{t("signIn")}</Text>
              )}
            </Pressable>
          </View>

          {/* Arabic blessing */}
          <Text style={styles.blessing}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  card: {
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: 15,
  },
  loginBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  blessing: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: "serif",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
