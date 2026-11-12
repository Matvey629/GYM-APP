import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppColors = {
  background: '#F4F5F0',
  surface: '#FFFFFF',
  text: '#17211B',
  muted: '#78827A',
  line: '#E3E8DF',
  green: '#C7F36B',
  dark: '#23372A',
  danger: '#B94D46',
};

export function AppScreen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, style]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );
  return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
}

export function PageHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function AppCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({ title, onPress, secondary = false, disabled = false, compact = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, compact && styles.compactButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText, compact && styles.compactButtonText]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, inputStyle, ...props }: TextInputProps & { label: string; inputStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor="#A0A9A0" {...props} style={[styles.input, inputStyle]} />
    </View>
  );
}

export function ChoiceChips({ options, selected, onToggle, multiple = false }: { options: { label: string; value: string }[]; selected: string | string[]; onToggle: (value: string) => void; multiple?: boolean }) {
  const isSelected = (value: string) => multiple ? (selected as string[]).includes(value) : selected === value;
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: isSelected(option.value) }} onPress={() => onToggle(option.value)} style={[styles.chip, isSelected(option.value) && styles.chipSelected]}>
          <Text style={[styles.chipText, isSelected(option.value) && styles.chipTextSelected]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100, gap: 16 },
  heading: { gap: 4, marginBottom: 2 },
  eyebrow: { color: AppColors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: AppColors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: AppColors.muted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: AppColors.surface, borderRadius: 18, padding: 17, gap: 12 },
  button: { minHeight: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: AppColors.dark, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#E9EEE4' },
  secondaryButtonText: { color: AppColors.text },
  compactButton: { minHeight: 38, borderRadius: 12, paddingHorizontal: 13 },
  compactButtonText: { fontSize: 12 },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  fieldWrap: { gap: 6 },
  fieldLabel: { color: AppColors.muted, fontSize: 11, fontWeight: '700' },
  input: { minHeight: 48, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.line, borderRadius: 13, paddingHorizontal: 13, color: AppColors.text, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: AppColors.line, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: AppColors.surface },
  chipSelected: { backgroundColor: AppColors.dark, borderColor: AppColors.dark },
  chipText: { color: AppColors.text, fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
});
