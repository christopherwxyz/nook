import { HubRpcClient, Message } from "@farcaster/hub-nodejs";
import { PrismaClient, FarcasterLink } from "@nook/common/prisma/farcaster";
import {
  timestampToDate,
  MessageHandlerArgs,
  bufferToHex,
  bufferToHexAddress,
} from "@nook/common/farcaster";
import {
  EventService,
  EventType,
  FarcasterLinkData,
  RawEvent,
} from "@nook/common/types";
import {
  publishRawEvent,
  publishRawEvents,
  toJobId,
} from "@nook/common/queues";

const prisma = new PrismaClient();

export const handleLinkAdd = async ({ message }: MessageHandlerArgs) => {
  const link = messageToLink(message);
  if (!link) return;

  await prisma.farcasterLink.upsert({
    where: {
      fid_linkType_targetFid: {
        fid: link.fid,
        linkType: link.linkType,
        targetFid: link.targetFid,
      },
    },
    create: link,
    update: link,
  });

  console.log(
    `[link-add] [${link.fid}] added ${link.linkType} to ${link.targetFid}`,
  );

  const event = transformToLinkEvent(EventType.LINK_ADD, link);
  await publishRawEvent(event);
};

export const handleLinkRemove = async ({ message }: MessageHandlerArgs) => {
  const link = messageToLink(message);
  if (!link) return;

  await prisma.farcasterLink.updateMany({
    where: {
      fid: link.fid,
      linkType: link.linkType,
      targetFid: link.targetFid,
    },
    data: {
      deletedAt: link.timestamp,
    },
  });

  console.log(
    `[link-remove] [${link.fid}] removed ${link.linkType} to ${link.targetFid}`,
  );

  const event = transformToLinkEvent(EventType.LINK_REMOVE, link);
  await publishRawEvent(event);
};

const messageToLink = (message: Message): FarcasterLink | undefined => {
  if (!message.data?.linkBody?.targetFid) return;
  return {
    fid: BigInt(message.data.fid),
    linkType: message.data.linkBody.type,
    targetFid: BigInt(message.data.linkBody.targetFid),
    timestamp: timestampToDate(message.data.timestamp),
    deletedAt: null,
    hash: bufferToHex(message.hash),
    hashScheme: message.hashScheme,
    signer: bufferToHexAddress(message.signer),
    signatureScheme: message.signatureScheme,
    signature: bufferToHex(message.signature),
  };
};

export const getAndBackfillLinks = async (
  client: HubRpcClient,
  fids: string[],
) => {
  const messages = (
    await Promise.all([
      ...fids.map(async (fid) => {
        const message = await client.getLinksByFid({
          fid: parseInt(fid),
        });

        if (message.isErr()) {
          return undefined;
        }

        return message.value.messages;
      }),
      ...fids.map(async (fid) => {
        const message = await client.getLinksByTarget({
          targetFid: parseInt(fid),
        });

        if (message.isErr()) {
          return undefined;
        }

        return message.value.messages;
      }),
    ])
  ).filter(Boolean) as Message[][];

  const links = await backfillLinks(messages.flat());

  const events = links.map((link) =>
    transformToLinkEvent(EventType.LINK_ADD, link),
  );
  await publishRawEvents(events);
  return events;
};

export const backfillLinks = async (messages: Message[]) => {
  const links = messages.map(messageToLink).filter(Boolean) as FarcasterLink[];
  if (links.length > 0) {
    await prisma.farcasterLink.createMany({
      data: links,
      skipDuplicates: true,
    });
  }
  return links;
};

const transformToLinkEvent = (
  type: EventType,
  link: FarcasterLink,
): RawEvent<FarcasterLinkData> => {
  const source = {
    service: EventService.FARCASTER,
    type,
    id: link.hash,
    entityId: link.fid.toString(),
  };
  return {
    eventId: toJobId(source),
    source,
    timestamp: link.timestamp.toString(),
    data: {
      fid: link.fid.toString(),
      linkType: link.linkType,
      targetFid: link.targetFid.toString(),
      timestamp: link.timestamp,
      signature: {
        hash: link.hash,
        hashScheme: link.hashScheme,
        signature: link.signature,
        signatureScheme: link.signatureScheme,
        signer: link.signer,
      },
    },
  };
};
