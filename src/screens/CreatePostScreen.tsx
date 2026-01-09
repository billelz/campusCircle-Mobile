import React, { useState, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { postService, channelService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RootStackParamList, Channel } from '../types';

type CreatePostScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePost'>;
type CreatePostScreenRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;

interface CreatePostScreenProps {
  navigation: CreatePostScreenNavigationProp;
  route: CreatePostScreenRouteProp;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation, route }) => {
  const preselectedChannelId = route.params?.channelId;
  const preselectedChannelName = route.params?.channelName;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const allChannels = await channelService.getAllChannels();
      setChannels(allChannels);
      
      // If preselected channel, find and set it
      if (preselectedChannelId) {
        const preselected = allChannels.find(c => c.id === preselectedChannelId);
        if (preselected) {
          setSelectedChannel(preselected);
        }
      }
    } catch (error) {
      console.log('Error fetching channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content for your post');
      return;
    }

    if (!selectedChannel) {
      Alert.alert('Error', 'Please select a channel');
      return;
    }

    setLoading(true);
    try {
      await postService.createPost({
        channelId: selectedChannel.id,
        title: title.trim(),
        content: content.trim(),
      });
      
      Alert.alert('Success', 'Your post has been created!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.log('Error creating post:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const renderChannelPicker = () => (
    <View style={styles.channelPickerOverlay}>
      <View style={styles.channelPickerContainer}>
        <View style={styles.channelPickerHeader}>
          <Text style={styles.channelPickerTitle}>Select Channel</Text>
          <TouchableOpacity onPress={() => setShowChannelPicker(false)}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.channelPickerList}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={[
                styles.channelPickerItem,
                selectedChannel?.id === channel.id && styles.channelPickerItemSelected,
              ]}
              onPress={() => {
                setSelectedChannel(channel);
                setShowChannelPicker(false);
              }}
            >
              <View style={styles.channelIcon}>
                <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelMembers}>
                  {channel.subscriberCount?.toLocaleString() || 0} members
                </Text>
              </View>
              {selectedChannel?.id === channel.id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!title.trim() || !content.trim() || !selectedChannel) && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !title.trim() || !content.trim() || !selectedChannel}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Channel Selector */}
          <TouchableOpacity
            style={styles.channelSelector}
            onPress={() => setShowChannelPicker(true)}
            disabled={loadingChannels}
          >
            {loadingChannels ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : selectedChannel ? (
              <>
                <View style={styles.selectedChannelIcon}>
                  <Ionicons name="chatbubbles" size={16} color={COLORS.white} />
                </View>
                <Text style={styles.selectedChannelName}>{selectedChannel.name}</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.channelPlaceholder}>Select a channel</Text>
              </>
            )}
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={300}
          />

          {/* Content Input */}
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Character Count */}
          <View style={styles.charCount}>
            <Text style={styles.charCountText}>{title.length}/300 title</Text>
          </View>
        </ScrollView>

        {/* Channel Picker Modal */}
        {showChannelPicker && renderChannelPicker()}
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
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  postButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  channelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  selectedChannelIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  selectedChannelName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  channelPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  titleInput: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  contentInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 200,
    padding: SPACING.sm,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: SPACING.md,
  },
  charCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  channelPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  channelPickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
  },
  channelPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  channelPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  channelPickerList: {
    padding: SPACING.md,
  },
  channelPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  channelPickerItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  channelMembers: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default CreatePostScreen;
