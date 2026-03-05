import React from "react";
import {
  Modal,
  View,
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  visible: boolean;
  authorizationUrl: string | null;
   PAYSTACK_CALLBACK_URL: string; // same as your PAYSTACK_CALLBACK_URL
  onClose: () => void;
  onReference: (ref: string) => void;
};

function getReference(url: string) {
  try {
    const u = new URL(url);
    return u.searchParams.get("reference");
  } catch {
    const m = url.match(/[?&]reference=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

export default function PaystackModal({
  visible,
  authorizationUrl,
  PAYSTACK_CALLBACK_URL,
  onClose,
  onReference,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.top}>
        <Pressable onPress={onClose} style={styles.btn}>
          <Text style={styles.btnText}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Paystack Checkout</Text>
        <View style={{ width: 70 }} />
      </View>

      {!authorizationUrl ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: authorizationUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Opening Paystack…</Text>
            </View>
          )}
          onNavigationStateChange={(nav) => {
            const url = nav.url || "";
            if (url.startsWith(PAYSTACK_CALLBACK_URL)) {
              const ref = getReference(url);
              if (ref) onReference(ref);
            }
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(107, 74, 58, 0.08)",
  },
  btnText: { color: colors.primary, fontWeight: "900" },
  title: { color: colors.text, fontWeight: "900" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { marginTop: 10, color: colors.muted, fontWeight: "700" },
});
