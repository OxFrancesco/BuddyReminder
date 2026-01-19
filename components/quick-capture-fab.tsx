import { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import QuickCaptureModal from "./quick-capture-modal";

export default function QuickCaptureFAB() {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.tint,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={colors.primaryForeground} />
      </TouchableOpacity>

      <QuickCaptureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 12, // Slightly rounded square
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 1000,
  },
});
