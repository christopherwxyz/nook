import { ChannelHeaderV2 } from "@nook/app/features/farcaster/channel-profile/channel-header";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { FarcasterFilteredFeed } from "@nook/app/features/farcaster/cast-feed/filtered-feed";
import { Channel, ChannelFilterType, UserFilterType } from "@nook/common/types";
import { NookText, Popover, XStack } from "@nook/app-ui";
import { formatToCDN } from "@nook/app/utils";
import { useChannel } from "@nook/app/hooks/useChannel";
import { CollapsibleGradientLayout } from "../CollapsibleGradientLayout";
import { Loading } from "@nook/app/components/loading";
import { Link } from "@nook/app/components/link";
import { IconButton } from "../IconButton";
import { Search, MoreHorizontal } from "@tamagui/lucide-icons";
import { FarcasterChannelMenu } from "@nook/app/components/farcaster/channels/channel-menu";
import { CreateActionButton } from "../ActionButton";
import { memo, useCallback, useState } from "react";

export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams();
  const { channel } = useChannel(channelId as string);

  if (!channel) return <Loading />;

  return (
    <>
      <CollapsibleGradientLayout
        title={<Title channel={channel} />}
        src={
          channel?.imageUrl
            ? formatToCDN(channel.imageUrl, { width: 168 })
            : undefined
        }
        header={<ChannelHeaderV2 channel={channel} size="$6" disableMenu />}
        pages={[
          {
            name: "Relevant",
            component: (
              <FarcasterFilteredFeed
                filter={{
                  users: {
                    type: UserFilterType.POWER_BADGE,
                    data: {
                      badge: true,
                    },
                  },
                  channels: {
                    type: ChannelFilterType.CHANNEL_URLS,
                    data: {
                      urls: [channel.url],
                    },
                  },
                }}
                asTabs
              />
            ),
          },
          {
            name: "Hosts",
            component: (
              <FarcasterFilteredFeed
                filter={{
                  users: {
                    type: UserFilterType.FIDS,
                    data: {
                      fids: channel.hostFids || [],
                    },
                  },
                  channels: {
                    type: ChannelFilterType.CHANNEL_URLS,
                    data: {
                      urls: [channel.url],
                    },
                  },
                }}
                asTabs
              />
            ),
          },
          {
            name: "Media",
            component: (
              <FarcasterFilteredFeed
                filter={{
                  users: {
                    type: UserFilterType.POWER_BADGE,
                    data: {
                      badge: true,
                    },
                  },
                  channels: {
                    type: ChannelFilterType.CHANNEL_URLS,
                    data: {
                      urls: [channel.url],
                    },
                  },
                  contentTypes: ["image", "application/x-mpegURL"],
                }}
                asTabs
              />
            ),
          },
          {
            name: "All",
            component: (
              <FarcasterFilteredFeed
                filter={{
                  channels: {
                    type: ChannelFilterType.CHANNEL_URLS,
                    data: {
                      urls: [channel.url],
                    },
                  },
                }}
                asTabs
              />
            ),
          },
        ]}
        right={<Menu channel={channel} />}
      />
      <CreateActionButton />
    </>
  );
}

const Title = memo(({ channel }: { channel: Channel }) => {
  return (
    <XStack alignItems="center" gap="$2">
      <NookText fontSize="$5" fontWeight="700">
        {channel.name}
      </NookText>
    </XStack>
  );
});

const Menu = memo(({ channel }: { channel: Channel }) => {
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(useCallback(() => setShowMenu(true), []));

  return (
    <XStack gap="$2" justifyContent="flex-end">
      <Link
        href={{
          pathname: "/search",
          params: { channel: JSON.stringify(channel) },
        }}
        unpressable
      >
        <IconButton icon={Search} />
      </Link>
      {showMenu ? (
        <FarcasterChannelMenu
          channel={channel}
          trigger={
            <Popover.Trigger asChild>
              <IconButton icon={MoreHorizontal} />
            </Popover.Trigger>
          }
        />
      ) : (
        <IconButton icon={MoreHorizontal} />
      )}
    </XStack>
  );
});
