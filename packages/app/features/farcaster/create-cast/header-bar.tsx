import { NookButton, XStack } from "@nook/app-ui";
import { X } from "@tamagui/lucide-icons";

export const CreateCastHeaderBar = ({ onClose }: { onClose: () => void }) => {
  return (
    <XStack alignItems="center" justifyContent="space-between" padding="$2">
      <NookButton
        size="$3"
        scaleIcon={1.5}
        circular
        icon={X}
        backgroundColor="transparent"
        borderWidth="$0"
        hoverStyle={{
          backgroundColor: "$color4",
          // @ts-ignore
          transition: "all 0.2s ease-in-out",
        }}
        onPress={onClose}
      />
    </XStack>
  );
};
