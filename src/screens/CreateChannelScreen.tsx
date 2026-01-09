import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { channelService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RootStackParamList, ChannelCategory } from '../types';

type CreateChannelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateChannel'>;

interface CreateChannelScreenProps {
  navigation: CreateChannelScreenNavigationProp;
}

const CATEGORIES: { id: ChannelCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'ACADEMICS', label: 'Academics', icon: 'school', color: '#3366FF' },
  { id: 'MENTAL_HEALTH', label: 'Mental Health', icon: 'heart', color: '#8B5CF6' },
  { id: 'CAREER', label: 'Career', icon: 'briefcase', color: '#F59E0B' },
  { id: 'CAMPUS_LIFE', label: 'Campus Life', icon: 'home', color: '#10B981' },
  { id: 'SOCIAL', label: 'Social', icon: 'people', color: '#EC4899' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: 'game-controller', color: '#06B6D4' },
  { id: 'MARKETPLACE', label: 'Marketplace', icon: 'cart', color: '#EF4444' },
  { id: 'GENERAL', label: 'General', icon: 'chatbubbles', color: '#6B7280' },
];

const CreateChannelScreen: React.FC<CreateChannelScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a channel name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);
    try {
      const newChannel = await channelService.createChannel({
        name: name.trim(),
        description: description.trim(),
        rules: rules.trim() || undefined,
        category: selectedCategory,
      });
      
      Alert.alert('Success', 'Your channel has been created!', [
        {
          text: 'View Channel',
          onPress: () => {
            navigation.replace('ChannelDetail', {
              channelId: newChannel.id,
              channelName: newChannel.name,
            });
          },
        },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.log('Error creating channel:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim() && description.trim() && selectedCategory;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Channel</Text>
          <TouchableOpacity
            style={[styles.createButton, !isValid && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !isValid}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Channel Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Channel Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Computer Science Help"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={styles.charCount}>{name.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this channel about?"
              placeholderTextColor={COLORS.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.categoryItemSelected,
                    selectedCategory === category.id && { borderColor: category.color },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon} size={20} color={category.color} />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && { color: category.color },
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rules (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Channel Rules (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="1. Be respectful\n2. No spam\n3. Stay on topic"
              placeholderTextColor={COLORS.textSecondary}
              value={rules}
              onChangeText={setRules}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{rules.length}/500</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              After creating your channel, you'll automatically become its moderator.
              You can invite others to help moderate.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  categoryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    margin: '1%',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: COLORS.background,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },
});

export default CreateChannelScreen;
