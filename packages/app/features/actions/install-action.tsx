"use client";

import { Dot } from "@tamagui/lucide-icons";
import {
  NookButton,
  Dialog,
  XStack,
  View,
  YStack,
  NookText,
} from "@nook/app-ui";
import { GradientIcon } from "../../components/gradient-icon";
import { useAuth } from "../../context/auth";
import { installAction } from "../../api/settings";
import { useQueryClient } from "@tanstack/react-query";
import { CastAction } from "@nook/common/types";
import { useCallback } from "react";
import { useRouter } from "solito/navigation";

export const InstallAction = ({
  action,
  onInstall,
  redirectOnInstall,
}: {
  action: CastAction;
  onInstall?: () => void;
  redirectOnInstall?: boolean;
}) => {
  const queryClient = useQueryClient();
  const { settings } = useAuth();
  const router = useRouter();

  const handlePress = useCallback(
    async (index: number) => {
      await installAction(index, action);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (onInstall) {
        onInstall();
      }

      if (redirectOnInstall) {
        router.push("/");
      }
    },
    [action, onInstall, queryClient, router, redirectOnInstall],
  );

  const actions: (CastAction | null)[] = [];
  for (let i = 0; i < 8; i++) {
    const existingAction = settings?.actions.find((a) => a.index === i);
    actions.push(existingAction ? existingAction.action : null);
  }

  const topBar = actions?.slice(0, 4);
  const bottomBar = actions?.slice(4);

  return (
    <View>
      <XStack gap="$4" padding="$4">
        <GradientIcon label={action.name} size="$6" icon={action.icon} />
        <YStack gap="$1" flexShrink={1}>
          <NookText variant="label" fontSize="$8">
            {action.name}
          </NookText>
          <NookText muted>{action.description}</NookText>
        </YStack>
      </XStack>
      <YStack gap="$5" padding="$4">
        <NookText fontWeight="500">Select an action to replace</NookText>
        <XStack gap="$5">
          {topBar.map((a, i) => (
            <NookButton
              key={`top-${i}`}
              backgroundColor="$color3"
              padding="$0"
              height="auto"
              hoverStyle={{
                opacity: 0.5,
                // @ts-ignore
                transition: "all 0.2s ease-in-out",
              }}
              borderWidth="$0"
              overflow="hidden"
              onPress={() => handlePress(i)}
            >
              {a && <GradientIcon label={a?.name} size="$6" icon={a?.icon} />}
              {!a && (
                <View
                  width="$6"
                  height="$6"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Dot size={32} />
                </View>
              )}
            </NookButton>
          ))}
        </XStack>
        <XStack gap="$5">
          {bottomBar.map((a, i) => (
            <NookButton
              key={`bottom-${i}`}
              backgroundColor="$color3"
              padding="$0"
              height="auto"
              hoverStyle={{
                opacity: 0.5,
                // @ts-ignore
                transition: "all 0.2s ease-in-out",
              }}
              borderWidth="$0"
              overflow="hidden"
              onPress={() => handlePress(i + 4)}
            >
              {a && <GradientIcon label={a?.name} size="$6" icon={a?.icon} />}
              {!a && (
                <View
                  width="$6"
                  height="$6"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Dot size={32} />
                </View>
              )}
            </NookButton>
          ))}
        </XStack>
      </YStack>
    </View>
  );
};
