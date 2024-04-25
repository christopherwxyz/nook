import { Channel } from "../../../types";
import { XStack, YStack } from "@nook/ui";
import { memo } from "react";
import { Link } from "solito/link";
import { FarcasterChannelDisplay } from "../../../components/farcaster/channels/channel-display";

export const FarcasterChannelFeedItem = memo(
  ({ channel, withBio }: { channel: Channel; withBio?: boolean }) => {
    return (
      <Link href={`/channels/${channel.channelId}`}>
        <YStack
          gap="$2"
          paddingHorizontal="$3.5"
          paddingVertical="$3"
          hoverStyle={{
            transform: "all 0.2s ease-in-out",
            backgroundColor: "$color2",
          }}
        >
          <XStack justifyContent="space-between">
            <FarcasterChannelDisplay channel={channel} withBio={withBio} />
          </XStack>
        </YStack>
      </Link>
    );
  },
);
