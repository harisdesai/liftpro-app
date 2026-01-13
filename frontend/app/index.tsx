import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Exercise {
  id: number;
  name: string;
  category: string;
  weight: number;
  reps: number;
  sets: number;
}

interface WorkoutDay {
  day: string;
  focus: string;
  exercises: { primary: string; alt: string; }[];
}

const STORAGE_KEY = '@liftpro_exercises';

export default function Index() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'split'>('tracker');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', category: 'Chest' });
  const [isLoading, setIsLoading] = useState(true);

  // Initial exercises
  const initialExercises: Exercise[] = [
    // PUSH
    { id: 1, name: 'Bench Press', category: 'Chest', weight: 60, reps: 5, sets: 3 },
    { id: 2, name: 'Incline DB Press', category: 'Chest', weight: 24, reps: 8, sets: 3 },
    { id: 3, name: 'Seated Shoulder Press', category: 'Shoulders', weight: 40, reps: 8, sets: 3 },
    { id: 4, name: 'Side Lateral Raises', category: 'Shoulders', weight: 10, reps: 12, sets: 4 },
    { id: 5, name: 'Tricep Pushdowns', category: 'Triceps', weight: 20, reps: 12, sets: 3 },
    { id: 6, name: 'Overhead DB Extension', category: 'Triceps', weight: 15, reps: 10, sets: 3 },
    // PULL
    { id: 7, name: 'Lat Pulldown', category: 'Back', weight: 50, reps: 10, sets: 3 },
    { id: 8, name: 'Seated Cable Row', category: 'Back', weight: 45, reps: 10, sets: 3 },
    { id: 9, name: 'Barbell Row', category: 'Back', weight: 50, reps: 8, sets: 3 },
    { id: 10, name: 'Face Pulls', category: 'Shoulders', weight: 15, reps: 15, sets: 3 },
    { id: 11, name: 'Bicep Curls (DB)', category: 'Biceps', weight: 12, reps: 10, sets: 3 },
    { id: 12, name: 'Hammer Curls', category: 'Biceps', weight: 12, reps: 10, sets: 3 },
    // LEGS
    { id: 13, name: 'Barbell Squats', category: 'Legs', weight: 80, reps: 5, sets: 3 },
    { id: 14, name: 'Leg Press', category: 'Legs', weight: 120, reps: 10, sets: 3 },
    { id: 15, name: 'Bulgarian Split Squats', category: 'Legs', weight: 15, reps: 8, sets: 3 },
    { id: 16, name: 'Leg Extensions', category: 'Legs', weight: 40, reps: 12, sets: 3 },
    { id: 17, name: 'Calf Raises', category: 'Legs', weight: 50, reps: 15, sets: 4 },
    // HAMS/GLUTES
    { id: 18, name: 'Romanian Deadlifts (RDLs)', category: 'Legs', weight: 70, reps: 8, sets: 3 },
    { id: 19, name: 'Hip Thrusts', category: 'Legs', weight: 100, reps: 8, sets: 3 },
    { id: 20, name: 'Hamstring Curls', category: 'Legs', weight: 35, reps: 12, sets: 3 },
    // CORE/CARDIO
    { id: 21, name: 'Plank', category: 'Core', weight: 0, reps: 60, sets: 3 },
    { id: 22, name: 'Hanging Leg Raises', category: 'Core', weight: 0, reps: 12, sets: 3 },
    { id: 23, name: 'Russian Twists', category: 'Core', weight: 10, reps: 20, sets: 3 },
    { id: 24, name: 'Cable Crunches', category: 'Core', weight: 30, reps: 15, sets: 3 },
  ];

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  const workoutSplit: WorkoutDay[] = [
    {
      day: "PUSH DAY",
      focus: "Chest, Shoulders, Triceps",
      exercises: [
        { primary: "Bench Press", alt: "DB Chest Press / Push-ups" },
        { primary: "Incline DB Press", alt: "Smith Machine Incline" },
        { primary: "Seated Shoulder Press", alt: "Arnold Press / DB Press" },
        { primary: "Side Lateral Raises", alt: "Cable Lateral Raises / Plate Raise" },
        { primary: "Tricep Pushdowns", alt: "Overhead Rope Extensions / Dips" },
        { primary: "Overhead DB Extension", alt: "Skull Crushers / Close-Grip Push-ups" }
      ]
    },
    {
      day: "PULL DAY",
      focus: "Back, Biceps",
      exercises: [
        { primary: "Lat Pulldown", alt: "Pull-ups / Assisted Pull-ups" },
        { primary: "Seated Cable Row", alt: "DB Rows / Barbell Rows" },
        { primary: "Barbell/DB Row", alt: "T-Bar Row / Chest-Supported Row" },
        { primary: "Face Pulls", alt: "Rear Delt Fly (Machine/DB)" },
        { primary: "Bicep Curls (DB)", alt: "EZ Bar Curl / Preacher Curl" },
        { primary: "Hammer Curls", alt: "Rope Cable Curl / Zottman Curl" }
      ]
    },
    {
      day: "LEG DAY (Quads + Glutes)",
      focus: "Quads, Glutes",
      exercises: [
        { primary: "Barbell Squats", alt: "Hack Squat / Smith Machine Squats" },
        { primary: "Leg Press", alt: "DB Goblet Squat / Lunge" },
        { primary: "Bulgarian Split Squats", alt: "Walking Lunges / Step-Ups" },
        { primary: "Leg Extensions", alt: "Sissy Squat / Wall Sit" },
        { primary: "Calf Raises", alt: "Leg Press Calf Raises / DB Raises" }
      ]
    },
    {
      day: "UPPER BODY VOLUME",
      focus: "Chest, Back, Shoulders, Arms",
      exercises: [
        { primary: "Incline Bench Press", alt: "DB Incline Press" },
        { primary: "Cable Chest Fly", alt: "Machine Fly / Pec Deck" },
        { primary: "Pull-ups", alt: "Lat Pulldown / Assisted Pull-ups" },
        { primary: "Arnold Press", alt: "DB Press / Machine Press" },
        { primary: "Rope Hammer Curls", alt: "Alt. Hammer Curls / Barbell Curls" },
        { primary: "Tricep Dips", alt: "Tricep Pushdown / Overhead Extension" }
      ]
    },
    {
      day: "LEG DAY (Hams + Glutes)",
      focus: "Hamstrings, Glutes",
      exercises: [
        { primary: "Romanian Deadlifts (RDLs)", alt: "Glute Bridges / Good Mornings" },
        { primary: "Hip Thrusts", alt: "Cable Pull-Through / Glute Bridges" },
        { primary: "Hamstring Curls", alt: "Stability Ball Leg Curl / DB Curls" },
        { primary: "Walking Lunges", alt: "Reverse Lunges / Step-Ups" },
        { primary: "Calf Raises", alt: "Barbell/Machine Calf Raises" }
      ]
    },
    {
      day: "CORE + CARDIO",
      focus: "Abs, Endurance",
      exercises: [
        { primary: "Plank", alt: "Weighted Plank / Side Plank" },
        { primary: "Hanging Leg Raises", alt: "Lying Leg Raises / Knee Raises" },
        { primary: "Russian Twists", alt: "Cable Twists / Decline Twists" },
        { primary: "Cable Crunches", alt: "Decline Bench Crunch / Wheel Rollout" },
        { primary: "Treadmill Walk", alt: "Stairmaster / Rowing / Jump Rope" }
      ]
    }
  ];

  const categories = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Biceps', 'Legs', 'Core', 'Cardio', 'Other'];

  // Load exercises from AsyncStorage on mount
  useEffect(() => {
    loadExercises();
  }, []);

  // Save exercises to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveExercises();
    }
  }, [exercises]);

  const loadExercises = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setExercises(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveExercises = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
    } catch (error) {
      console.error('Error saving exercises:', error);
    }
  };

  const addExercise = () => {
    if (!newEx.name.trim()) return;
    setExercises([...exercises, { ...newEx, id: Date.now(), weight: 0, reps: 0, sets: 3 }]);
    setNewEx({ name: '', category: 'Chest' });
    setShowAddForm(false);
  };

  const updateValue = (id: number, field: keyof Exercise, value: string) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: Math.max(0, parseFloat(value) || 0) } : ex
    ));
  };

  const incrementValue = (id: number, field: 'weight' | 'reps' | 'sets', amount: number) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: Math.max(0, (parseFloat(ex[field].toString()) || 0) + amount) } : ex
    ));
  };

  const removeExercise = (id: number) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setExercises(exercises.filter(ex => ex.id !== id))
        }
      ]
    );
  };

  const filteredAndGroupedExercises = useMemo(() => {
    const filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: { [key: string]: Exercise[] } = {};
    filtered.forEach(ex => {
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    });
    return groups;
  }, [exercises, searchQuery]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="trending-up" size={20} color="#fff" />
            </View>
            <Text style={styles.logoText}>LIFTPRO</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {activeTab === 'tracker' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercise or category..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'tracker' ? (
            <View style={styles.trackerView}>
              {/* Add Form */}
              {showAddForm && (
                <View style={styles.addForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Exercise name..."
                    placeholderTextColor="#94A3B8"
                    value={newEx.name}
                    onChangeText={(text) => setNewEx({ ...newEx, name: text })}
                  />
                  <View style={styles.pickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryChip,
                            newEx.category === cat && styles.categoryChipActive
                          ]}
                          onPress={() => setNewEx({ ...newEx, category: cat })}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            newEx.category === cat && styles.categoryChipTextActive
                          ]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <TouchableOpacity style={styles.submitButton} onPress={addExercise}>
                    <Text style={styles.submitButtonText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Exercises List */}
              {Object.keys(filteredAndGroupedExercises).length > 0 ? (
                Object.entries(filteredAndGroupedExercises).map(([category, items]) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {items.map((item) => (
                      <View key={item.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <View style={styles.exerciseTitleContainer}>
                            <View style={styles.exerciseDot} />
                            <Text style={styles.exerciseTitle}>{item.name}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeExercise(item.id)}>
                            <Ionicons name="trash-outline" size={18} color="#CBD5E1" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.controlsContainer}>
                          {/* Sets */}
                          <View style={styles.controlBox}>
                            <Text style={styles.controlLabel}>SETS</Text>
                            <View style={styles.controlButtons}>
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'sets', -1)}>
                                <Ionicons name="remove-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                              <TextInput
                                style={styles.controlInput}
                                keyboardType="numeric"
                                value={item.sets.toString()}
                                onChangeText={(text) => updateValue(item.id, 'sets', text)}
                              />
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'sets', 1)}>
                                <Ionicons name="add-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Weight */}
                          <View style={styles.controlBox}>
                            <Text style={styles.controlLabel}>WEIGHT (KG)</Text>
                            <View style={styles.controlButtons}>
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'weight', -2.5)}>
                                <Ionicons name="remove-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                              <TextInput
                                style={styles.controlInput}
                                keyboardType="decimal-pad"
                                value={item.weight.toString()}
                                onChangeText={(text) => updateValue(item.id, 'weight', text)}
                              />
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'weight', 2.5)}>
                                <Ionicons name="add-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Reps */}
                          <View style={styles.controlBox}>
                            <Text style={styles.controlLabel}>REPS</Text>
                            <View style={styles.controlButtons}>
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'reps', -1)}>
                                <Ionicons name="remove-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                              <TextInput
                                style={styles.controlInput}
                                keyboardType="numeric"
                                value={item.reps.toString()}
                                onChangeText={(text) => updateValue(item.id, 'reps', text)}
                              />
                              <TouchableOpacity onPress={() => incrementValue(item.id, 'reps', 1)}>
                                <Ionicons name="add-circle-outline" size={20} color="#CBD5E1" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={48} color="#E2E8F0" />
                  <Text style={styles.emptyText}>No exercises found matching your search.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.splitView}>
              {/* Split Header */}
              <View style={styles.splitHeader}>
                <Text style={styles.splitHeaderTitle}>Workout Split</Text>
                <Text style={styles.splitHeaderSubtitle}>
                  Stick to the plan, master the movements.
                </Text>
              </View>

              {/* Workout Days */}
              {workoutSplit.map((day, idx) => (
                <View key={idx} style={styles.dayCard}>
                  <View style={styles.dayCardHeader}>
                    <View>
                      <Text style={styles.dayTitle}>{day.day}</Text>
                      <Text style={styles.dayFocus}>{day.focus}</Text>
                    </View>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>DAY {idx + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.exerciseTable}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderText}>PRIMARY</Text>
                      <Text style={styles.tableHeaderText}>ALTERNATE OPTION</Text>
                    </View>
                    {day.exercises.map((ex, i) => (
                      <View key={i} style={styles.tableRow}>
                        <Text style={styles.tablePrimary}>{ex.primary}</Text>
                        <Text style={styles.tableAlt}>{ex.alt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Watermark */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>MADE BY HARIS</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('tracker')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="barbell" 
            size={24} 
            color={activeTab === 'tracker' ? '#4F46E5' : '#CBD5E1'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'tracker' && styles.tabTextActive
          ]}>
            TRACKER
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('split')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="clipboard" 
            size={24} 
            color={activeTab === 'split' ? '#4F46E5' : '#CBD5E1'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'split' && styles.tabTextActive
          ]}>
            SPLIT
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    backgroundColor: '#4F46E5',
    padding: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  trackerView: {
    padding: 16,
    paddingBottom: 100,
  },
  addForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 6,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94A3B8',
  },
  splitView: {
    padding: 16,
    paddingBottom: 100,
  },
  splitHeader: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  splitHeaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  splitHeaderSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    opacity: 0.8,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  dayCardHeader: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 1,
  },
  dayFocus: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  dayBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  exerciseTable: {
    padding: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tablePrimary: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  tableAlt: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  watermark: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CBD5E1',
    letterSpacing: 4,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 32,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#CBD5E1',
  },
  tabTextActive: {
    color: '#4F46E5',
  },
});
