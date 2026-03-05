// src/theme/shadow.ts
import { Platform } from "react-native";
import { colors } from "./colors";

export const shadow = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  android: {
    elevation: 6,
  },
  default: {},
});
