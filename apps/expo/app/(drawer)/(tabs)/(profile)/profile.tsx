import { UserHeader } from "@nook/app/features/farcaster/user-profile/user-header";
import { FarcasterFilteredFeed } from "@nook/app/features/farcaster/cast-feed/filtered-feed";
import { Display, UserFilterType } from "@nook/common/types";
import { NookText, XStack } from "@nook/app-ui";
import { FarcasterPowerBadge } from "@nook/app/components/farcaster/users/power-badge";
import { formatToCDN } from "@nook/app/utils";
import { TransactionFeed } from "@nook/app/features/transactions/transaction-feed";
import { CollapsibleGradientLayout } from "../../../../components/CollapsibleGradientLayout";
import { useAuth } from "@nook/app/context/auth";
import { NftFeed } from "@nook/app/features/nft/nft-feed";
import { TokenHoldings } from "@nook/app/features/token/token-holdings";

export default function ProfileScreen() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <CollapsibleGradientLayout
      title={
        <XStack alignItems="center" gap="$2" flexShrink={1}>
          <NookText
            fontSize="$5"
            fontWeight="700"
            ellipsizeMode="tail"
            numberOfLines={1}
            flexShrink={1}
          >
            {user.displayName || user.username}
          </NookText>
          <FarcasterPowerBadge badge={user.badges?.powerBadge ?? false} />
        </XStack>
      }
      src={user?.pfp ? formatToCDN(user.pfp, { width: 168 }) : undefined}
      header={<UserHeader user={user} size="$6" disableMenu />}
      pages={[
        {
          name: "Casts",
          component: (
            <FarcasterFilteredFeed
              filter={{
                users: {
                  type: UserFilterType.FIDS,
                  data: {
                    fids: [user.fid],
                  },
                },
              }}
              asTabs
            />
          ),
        },
        {
          name: "Replies",
          component: (
            <FarcasterFilteredFeed
              filter={{
                users: {
                  type: UserFilterType.FIDS,
                  data: {
                    fids: [user.fid],
                  },
                },
                onlyReplies: true,
              }}
              asTabs
            />
          ),
        },
        {
          name: "Collectibles",
          component: (
            <NftFeed
              filter={{
                users: {
                  type: UserFilterType.FID,
                  data: {
                    fid: user.fid,
                  },
                },
              }}
              asTabs
            />
          ),
        },
        {
          name: "Tokens",
          component: (
            <TokenHoldings
              filter={{
                fid: user.fid,
              }}
              asTabs
            />
          ),
        },
        {
          name: "Transactions",
          component: (
            <TransactionFeed
              filter={{
                users: {
                  type: UserFilterType.FIDS,
                  data: {
                    fids: [user.fid],
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
                  type: UserFilterType.FIDS,
                  data: {
                    fids: [user.fid],
                  },
                },
                contentTypes: ["image"],
              }}
              displayMode={Display.GRID}
              asTabs
            />
          ),
        },
        {
          name: "Frames",
          component: (
            <FarcasterFilteredFeed
              filter={{
                users: {
                  type: UserFilterType.FIDS,
                  data: {
                    fids: [user.fid],
                  },
                },
                onlyFrames: true,
              }}
              displayMode={Display.FRAMES}
              asTabs
            />
          ),
        },
      ]}
    />
  );
}
