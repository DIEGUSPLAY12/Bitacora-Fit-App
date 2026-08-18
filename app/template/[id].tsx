import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { ArrowLeft, Play, Send, Pencil, Dumbbell, Trash2 } from "lucide-react-native";
import { useWorkoutDetail } from "../../hooks/useWorkouts";
import { useDeleteTemplate } from "../../hooks/useTemplates";
import { useWorkoutStore, WorkoutExercise } from "../../store/workout-store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { customAlert } from "../../store/alert-store";

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: template, isLoading } = useWorkoutDetail(id as string);
  const deleteTemplate = useDeleteTemplate();
  const loadFromTemplate = useWorkoutStore((state) => state.loadFromTemplate);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontro la plantilla</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const numExercises = template.workout_exercises?.length || 0;

  const distribution: Record<string, number> = {};
  let totalEx = 0;
  template.workout_exercises?.forEach((we: any) => {
    // target = primary muscle ("lats", "chest"...) | category = body part ("back", "chest"...)
    // muscle_group = secondary muscles (wrong for distribution)
    const group = we.exercises?.target || we.exercises?.category;
    if (group) {
      const key = group.toLowerCase();
      distribution[key] = (distribution[key] || 0) + 1;
      totalEx++;
    }
  });

  const distArray = Object.entries(distribution)
    .map(([group, count]) => ({ group, count, percentage: Math.round((count / totalEx) * 100) }))
    .sort((a, b) => b.percentage - a.percentage);

  const handleStart = () => {
    const exercisesForStore: WorkoutExercise[] = (template.workout_exercises || []).map((we: any) => ({
      exercise: {
        id: we.exercises.id,
        name: we.exercises.name,
        category: we.exercises.category,
        equipment: "",
        target: "",
        muscle_group: we.exercises.muscle_group,
        secondary_muscles: [],
        instructions_es: "",
        image_url: we.exercises.image_url,
        gif_url: we.exercises.gif_url,
      },
      sets: (we.sets || []).map((s: any) => ({
        id: Math.random().toString(),
        weight: s.weight_kg,
        reps: s.reps,
        completed: false,
      })),
    }));
    loadFromTemplate(exercisesForStore);
    router.replace("/entrenar");
  };

  const pillColors = [
    "rgba(180,240,60,0.18)",
    "rgba(180,240,60,0.12)",
    "rgba(180,240,60,0.08)",
    "rgba(180,240,60,0.05)",
  ];
  const pillBorders = [
    "rgba(180,240,60,0.45)",
    "rgba(180,240,60,0.3)",
    "rgba(180,240,60,0.2)",
    "rgba(180,240,60,0.1)",
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* HERO HEADER */}
        <View style={[styles.heroContainer, { marginTop: insets.top }]}>
          <LinearGradient
            colors={["#1E2D0A", "#141A07", "#111111"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={[styles.glowDot, { top: insets.top + 10 }]} />

          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <ArrowLeft color={colors.textPrimary} size={22} />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push({ pathname: "/compartir", params: { workoutId: template.id } })}
              >
                <Send color={colors.textPrimary} size={19} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push({ pathname: "/template/editar/[id]", params: { id: template.id } })}
              >
                <Pencil color={colors.textPrimary} size={19} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButtonRed}
                onPress={() => {
                  customAlert(
                    "Eliminar plantilla",
                    `¿Estás seguro de que quieres eliminar "${template.name}"? Esta acción no se puede deshacer.`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await deleteTemplate.mutateAsync(template.id);
                            router.back();
                          } catch (e: any) {
                            customAlert("Error", "No se pudo eliminar la plantilla: " + e.message);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Trash2 color={colors.destructive} size={19} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroTitleBlock}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Plantilla</Text>
            </View>
            <Text style={styles.heroTitle}>{template.name}</Text>
            <Text style={styles.heroSubtitle}>
              {numExercises} {numExercises === 1 ? "ejercicio" : "ejercicios"}{"  "}·{"  "}~45 min
            </Text>
          </View>
        </View>

        {/* MUSCLE DISTRIBUTION */}
        {distArray.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribucion Muscular</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.distPillsRow}>
              {distArray.map((item, i) => (
                <View
                  key={item.group}
                  style={[
                    styles.distPill,
                    {
                      backgroundColor: pillColors[Math.min(i, pillColors.length - 1)],
                      borderColor: pillBorders[Math.min(i, pillBorders.length - 1)],
                    },
                  ]}
                >
                  <Dumbbell size={13} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.distPillText}>
                    {item.group.charAt(0).toUpperCase() + item.group.slice(1)}
                  </Text>
                  <Text style={styles.distPillPct}> {item.percentage}%</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* EXERCISES LIST */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{numExercises} Ejercicios</Text>
          <View style={styles.exercisesList}>
            {template.workout_exercises?.map((we: any, index: number) => {
              const numSets = we.sets?.length || 0;
              const firstReps = we.sets?.[0]?.reps || 0;
              const isLast = index === numExercises - 1;
              return (
                <View key={we.id} style={[styles.exerciseRow, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.exImageContainer}>
                    {we.exercises?.image_url ? (
                      <Image source={{ uri: we.exercises.image_url }} style={styles.exImage} contentFit="cover" />
                    ) : (
                      <View style={styles.exImageFallback}>
                        <Text style={styles.exImageFallbackText}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.exDetails}>
                    <Text style={styles.exSets}>
                      {numSets} {numSets === 1 ? "serie" : "series"} x {firstReps} reps
                    </Text>
                    <Text style={styles.exName} numberOfLines={2}>
                      {we.exercises?.name}
                    </Text>
                  </View>
                  <View style={styles.exIndexBadge}>
                    <Text style={styles.exIndexText}>{index + 1}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* FLOATING START BUTTON */}
      <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent, "#90D41C"]}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Play color={colors.background} size={20} fill={colors.background} style={{ marginRight: 4 }} />
            <Text style={styles.startButtonText}>Empezar Entrenamiento</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.textSecondary, fontFamily: typography.fontFamily.medium },

  heroContainer: { paddingBottom: 28, overflow: "hidden", marginBottom: 4 },
  glowDot: {
    position: "absolute",
    top: 0,
    left: -40,
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
    paddingTop: 12,
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
  iconButtonRed: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(207,102,121,0.08)",
    borderWidth: 1,
    borderColor: "rgba(207,102,121,0.2)",
  },
  heroTitleBlock: { paddingHorizontal: 20 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(180,240,60,0.15)",
    borderWidth: 1,
    borderColor: "rgba(180,240,60,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 34,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    lineHeight: 40,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  distBarContainer: { gap: 10, marginBottom: 16 },
  distBarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  distBarLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    width: 80,
    textTransform: "capitalize",
  },
  distBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    overflow: "hidden",
  },
  distBarFill: { height: "100%", borderRadius: 4 },
  distBarPct: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: colors.accent,
    width: 36,
    textAlign: "right",
  },

  distPillsRow: { gap: 8, paddingBottom: 2 },
  distPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  distPillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  distPillPct: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.accent,
  },

  exercisesList: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  exImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
    marginRight: 14,
    flexShrink: 0,
  },
  exImage: { width: "100%", height: "100%" },
  exImageFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(180,240,60,0.07)",
  },
  exImageFallbackText: {
    color: colors.accent,
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
  },
  exDetails: { flex: 1, marginRight: 10 },
  exSets: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  exName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    textTransform: "capitalize",
    lineHeight: 20,
  },
  exIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(180,240,60,0.1)",
    borderWidth: 1,
    borderColor: "rgba(180,240,60,0.2)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  exIndexText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    color: colors.accent,
  },

  floatingFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  startButton: {
    borderRadius: 16,
    height: 58,
    overflow: "hidden",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.background,
  },
});