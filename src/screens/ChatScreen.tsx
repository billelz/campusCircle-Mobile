import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context';
import { messageService, websocketService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RootStackParamList, Message } from '../types';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { conversationId, participantName, recipientUsername, recipientName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the recipient username from route params or participantName
  const recipient = recipientUsername || recipientName || participantName;

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      if (activeConversationId) {
        const conversation = await messageService.getConversationById(activeConversationId);
        if (conversation.messages?.length > 0) {
          setMessages(conversation.messages);
        }
        // Mark conversation as read
        await messageService.markAsRead(activeConversationId);
        return;
      }

      if (recipient) {
        const conversation = await messageService.getConversationWith(recipient);
        if (conversation) {
          setActiveConversationId(conversation.id);
          if (conversation.messages?.length > 0) {
            setMessages(conversation.messages);
          }
          await messageService.markAsRead(conversation.id);
        }
      }
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    // Only process messages from the current conversation
    if (message.sender === recipient || message.recipient === recipient) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: message.sender,
        text: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    }
  }, [recipient]);

  // Handle typing indicators
  const handleTypingIndicator = useCallback((data: any) => {
    if (data.sender === recipient) {
      setPeerTyping(data.isTyping);
    }
  }, [recipient]);

  useEffect(() => {
    fetchMessages();

    // Connect to WebSocket if user is available
    if (user?.username) {
      websocketService.connect(user.username).catch(console.error);

      // Register message callback
      websocketService.onMessage('chat-screen', handleWebSocketMessage);
      websocketService.onTyping('chat-screen', handleTypingIndicator);
    }

    return () => {
      // Cleanup callbacks
      websocketService.offMessage('chat-screen');
      websocketService.offTyping('chat-screen');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeConversationId, user?.username, handleWebSocketMessage, handleTypingIndicator, recipient]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Send typing indicator via WebSocket
    if (text.length > 0 && !isTyping && recipient) {
      setIsTyping(true);
      websocketService.sendTypingIndicator(recipient, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && recipient) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(recipient, false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    if (!recipient && !activeConversationId) return;

    const messageText = inputText.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: user.username,
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add message to UI
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setIsTyping(false);

    // Stop typing indicator
    if (recipient) {
      websocketService.sendTypingIndicator(recipient, false);
    }

    try {
      // Send via WebSocket for real-time delivery
      if (websocketService.isConnected() && recipient) {
        websocketService.sendMessage(recipient, messageText);
      }

      // Also persist via REST API
      if (activeConversationId) {
        await messageService.sendMessage(activeConversationId, messageText);
      } else if (recipient) {
        const conversation = await messageService.sendMessageToUser(recipient, messageText);
        setActiveConversationId(conversation.id);
      }
    } catch (error) {
      console.log('Error sending message:', error);
      // Message already shown optimistically, could add retry UI
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (sender: string): boolean => {
    return sender === user?.username || sender === 'current_user';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = isOwnMessage(item.sender);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.timeText, isOwn && styles.ownTimeText]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  const renderDateSeparator = () => (
    <View style={styles.dateSeparator}>
      <View style={styles.datePill}>
        <Text style={styles.dateText}>Today</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{participantName}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderDateSeparator}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Typing Indicator */}
        {peerTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{participantName} is typing...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Message"
              placeholderTextColor={COLORS.gray400}
              multiline
            />
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: SPACING.base,
  },
  datePill: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SPACING.xs,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.gray100,
    borderBottomLeftRadius: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  ownTimeText: {
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.xs,
  },
  attachButton: {
    padding: SPACING.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray50,
  },
  typingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default ChatScreen;
