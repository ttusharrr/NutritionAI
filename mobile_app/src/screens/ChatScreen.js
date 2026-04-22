import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { chatWithAgent } from '../api/authApi';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your NutriAI Expert. Ask me anything about nutrition, diet plans, or healthy eating! 🥗" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  // Typing indicator animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      const createAnim = (dot, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        );
      const a1 = createAnim(dot1, 0);
      const a2 = createAnim(dot2, 150);
      const a3 = createAnim(dot3, 300);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await chatWithAgent(userMsg.content, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting right now. Please try again." 
      }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatarContainer, styles.userAvatar]}>
            <Ionicons name="person" size={14} color="#000" />
          </View>
        )}
      </View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.messageBubbleWrapper, styles.assistantWrapper]}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>🤖</Text>
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              { transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={COLORS.gradients.dark}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - Parity with Web */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerEmoji}>🤖</Text>
              <View style={styles.onlineBadge} />
            </View>
            <View>
              <Text style={styles.headerTitle}>NutriAI Expert</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing analysis...' : 'Agentic Reasoning Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {/* Input Area - Parity with Web */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about your nutritional blueprint..."
                placeholderTextColor={COLORS.textTertiary}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <LinearGradient
                  colors={input.trim() && !isTyping ? COLORS.gradients.primary : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={styles.sendBtnGradient}
                >
                  <Ionicons name="arrow-up" size={20} color={input.trim() && !isTyping ? '#000' : COLORS.textTertiary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 16,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  headerEmoji: {
    fontSize: 24,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  /* Messages */
  messagesList: {
    padding: SPACING.lg,
    paddingBottom: 24,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
    gap: 10,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  assistantWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: COLORS.primary,
    borderColor: 'transparent',
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  userText: {
    color: COLORS.text,
  },
  assistantText: {
    color: COLORS.text,
  },
  /* Typing */
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },
  /* Input */
  inputArea: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 2,
  },
  sendBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
