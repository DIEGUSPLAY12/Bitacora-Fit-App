import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { ArrowLeft, Plus, Dumbbell, Pencil, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTemplates, useDeleteTemplate } from "../../hooks/useTemplates";
import { MotiView } from "moti";

export default function PlantillasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Eliminar plantilla",
      `Estas seguro de que quieres eliminar "${name}"? Esta accion no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteTemplate.mutateAsync(id);
            } catch (e: any) {
              Alert.alert("Error", "No se pudo eliminar la plantilla: " + e.message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getMuscleGroups = (template: any): string[] => {
    const groups = new Set<string>();
    template.workout_exercises?.forEach((we: any) => {
      const g = we.exercises?.target || we.exercises?.category;
      if (g) groups.add(g.toLowerCase());
    });
    return Array.from(groups).slice(0, 3);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <LinearGradient
          colors={["#1E2D0A", "#141A07", "#111111"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.glowDot} />

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push("/template/crear")}
            activeOpacity={0.85}
          >
            <Plus color={colors.background} size={18} />
            <Text style={styles.newButtonText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleBlock}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Biblioteca</Text>
          </View>
          <Text style={styles.headerTitle}>Mis Plantillas</Text>
          <Text style={styles.headerSubtitle}>
            {templates?.length || 0} {(templates?.length || 0) === 1 ? "plantilla guardada" : "plantillas guardadas"}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 60 }} />
      ) : !templates || templates.length === 0 ? (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.emptyState}
        >
          <View style={styles.emptyIconBg}>
            <Dumbbell color={colors.accent} size={36} />
          </View>
          <Text style={styles.emptyTitle}>Sin plantillas aun</Text>
          <Text style={styles.emptyText}>Crea tu primera plantilla de entrenamiento para tenerla siempre a mano.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/template/crear")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.accent, "#90D41C"]}
              style={styles.emptyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Plus color={colors.background} size={18} />
              <Text style={styles.emptyButtonText}>Crear plantilla</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {templates.map((template: any, index: number) => {
            const exerciseCount = template.workout_exercises?.length || 0;
            const muscleGroups = getMuscleGroups(template);
            const isDeleting = deletingId === template.id;

            return (
              <MotiView
                key={template.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 220, delay: index * 35 }}
              >
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/template/${template.id}`)}
                >
                  <LinearGradient
                    colors={["#1F2514", "#10140A"]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.65)"]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.3, 1]}
                  />

                  <View style={styles.cardContent}>
                    {/* Badge */}
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardBadgeText}>Plantilla</Text>
                    </View>

                    {/* Name */}
                    <Text style={styles.cardTitle} numberOfLines={2}>{template.name}</Text>

                    {/* Muscle groups as tags */}
                    {muscleGroups.length > 0 && (
                      <View style={styles.muscleRow}>
                        {muscleGroups.map((g) => (
                          <View key={g} style={styles.muscleTag}>
                            <Text style={styles.muscleTagText}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Stats + actions row */}
                    <View style={styles.cardFooter}>
                      <View style={styles.statChip}>
                        <Dumbbell color={colors.accent} size={13} style={{ marginRight: 5 }} />
                        <Text style={styles.statChipText}>{exerciseCount} ejercicios</Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          activeOpacity={0.7}
                          onPress={() => router.push({ pathname: "/template/editar/[id]", params: { id: template.id } })}
                        >
                          <Pencil color={colors.accent} size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnRed]}
                          activeOpacity={0.7}
                          onPress={() => handleDelete(template.id, template.name)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size={14} color={colors.destructive} />
                          ) : (
                            <Trash2 color={colors.destructive} size={16} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { overflow: "hidden", paddingBottom: 24, marginBottom: 4 },
  glowDot: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(180,240,60,0.08)",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.background,
  },
  headerTitleBlock: { paddingHorizontal: 20 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(180,240,60,0.15)",
    borderWidth: 1,
    borderColor: "rgba(180,240,60,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 30,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    lineHeight: 36,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },

  listContent: { padding: 20, paddingBottom: 100, gap: 14 },

  // Card
  card: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardContent: { padding: 18, gap: 12, zIndex: 2 },
  cardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(180,240,60,0.15)",
    borderWidth: 1,
    borderColor: "rgba(180,240,60,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  cardBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    lineHeight: 28,
  },
  muscleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  muscleTag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  muscleTagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  statChip: { flexDirection: "row", alignItems: "center" },
  statChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  actionButtons: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(180,240,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(180,240,60,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnRed: {
    backgroundColor: "rgba(207,102,121,0.08)",
    borderColor: "rgba(207,102,121,0.2)",
  },

  // Empty state
  emptyState: {
    margin: 24,
    padding: 36,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(180,240,60,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
    height: 50,
  },
  emptyButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    color: colors.background,
  },
});