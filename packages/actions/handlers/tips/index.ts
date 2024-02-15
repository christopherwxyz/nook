import {
  Content,
  ContentActionData,
  EventAction,
  EventActionType,
  PostData,
  Protocol,
  TipActionData,
  Topic,
  TopicType,
} from "@flink/common/types";
import { DEGEN_ASSET_ID } from "@flink/common/constants";
import { MongoClient } from "@flink/common/mongo";

export const handleTips = async (
  client: MongoClient,
  action: EventAction<ContentActionData>,
  content: Content<PostData>,
  isUntip = false,
) => {
  const rawTips = extractTips(content.data);
  if (rawTips.length === 0) return [];

  const entity = await client.findEntity(content.data.entityId);
  if (!entity) {
    throw new Error(`Entity not found for ${content.data.entityId}`);
  }

  const ethAccounts =
    entity.blockchain?.filter((b) => b.protocol === Protocol.ETHEREUM) || [];
  if (ethAccounts.length === 0) {
    throw new Error(`No Ethereum addresses found for entity ${entity._id}`);
  }

  const addresses = ethAccounts.map((a) => a.address);

  const { tipAllowance, tipUsage } = await getTipAllowanceAndUsage(
    addresses,
    rawTips,
  );

  if (tipAllowance < tipUsage) {
    throw new Error(
      `Insufficient tip allowance: ${tipAllowance} < ${tipUsage} for ${addresses} `,
    );
  }

  return rawTips.map((tip) => {
    const topics: Topic[] = [
      {
        type: TopicType.TIP_ASSET,
        value: DEGEN_ASSET_ID,
      },
      {
        type: TopicType.TIP_SOURCE,
        value: tip.sourceContentId,
      },
      {
        type: TopicType.TIP_TARGET,
        value: tip.targetContentId,
      },
      {
        type: TopicType.TIP_SOURCE_ENTITY,
        value: tip.entityId.toString(),
      },
      {
        type: TopicType.TIP_TARGET_ENTITY,
        value: tip.targetEntityId.toString(),
      },
    ];

    if (content.data.channelId) {
      topics.push({
        type: TopicType.CHANNEL,
        value: content.data.channelId,
      });
    }

    return {
      eventId: action.eventId,
      source: action.source,
      timestamp: content.timestamp,
      entityId: content.data.entityId,
      referencedEntityIds: content.referencedEntityIds,
      referencedContentIds: content.referencedContentIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: isUntip ? EventActionType.UNTIP : EventActionType.TIP,
      data: tip,
      topics,
    };
  });
};

const extractTips = ({
  contentId,
  entityId,
  parentId,
  parentEntityId,
  text,
}: PostData): TipActionData[] => {
  if (!parentId || !parentEntityId) return [];
  if (parentEntityId.equals(entityId)) return [];
  const degenTipPattern = /(\d+)\s+\$DEGEN/gi;
  const matches = [...text.matchAll(degenTipPattern)];
  return matches.map((match) => ({
    entityId,
    targetEntityId: parentEntityId,
    contentId: DEGEN_ASSET_ID.toLowerCase(),
    amount: parseInt(match[1], 10),
    sourceContentId: contentId,
    targetContentId: parentId,
  }));
};

const getTipAllowanceAndUsage = async (
  addresses: string[],
  tips: TipActionData[],
) => {
  const responses = await Promise.all(
    addresses.map(async (address) => {
      const data = await fetch(
        `https://www.degen.tips/api/airdrop2/tip-allowance?address=${address}`,
      )
        .then((res) => res.json())
        .then((res) => res[0]);
      if (!data) return 0;
      return parseInt(data.tip_allowance, 10);
    }),
  );

  const tipAllowance = responses.reduce((acc, curr) => acc + curr, 0);
  const tipUsage = tips.reduce((acc, tip) => acc + tip.amount, 0);

  return {
    tipAllowance,
    tipUsage,
  };
};
