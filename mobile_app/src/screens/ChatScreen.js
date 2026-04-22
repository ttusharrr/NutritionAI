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
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>NutriAI Expert</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>
          <View style={styles.headerDot}>
            <View style={[styles.statusDot, isTyping && styles.statusDotTyping]} />
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
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

          {/* Input Area */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about nutrition..."
                placeholderTextColor={COLORS.textTertiary}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Ionicons name="send" size={18} color={input.trim() && !isTyping ? '#000' : COLORS.textTertiary} />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 14,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  headerDot: {
    padding: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  statusDotTyping: {
    backgroundColor: COLORS.accent,
  },
  /* Messages */
  messagesList: {
    padding: SPACING.lg,
    paddingBottom: 12,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
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
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
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
    color: '#000',
  },
  assistantText: {
    color: COLORS.text,
  },
  /* Typing */
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textTertiary,
  },
  /* Input */
  inputArea: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 8 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
