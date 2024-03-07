import {
  HubRpcClient,
  Message,
  MessageType,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { Prisma, PrismaClient } from "@nook/common/prisma/farcaster";
import {
  findRootParent,
  messageToCast,
  messageToCastEmbedCast,
  messageToCastEmbedUrl,
  messageToCastMentions,
  messageToCastReaction,
  messageToLink,
  messageToUrlReaction,
  messageToUserData,
  messageToUsernameProof,
  messageToVerification,
} from "../utils";
import {
  bufferToHex,
  bufferToHexAddress,
  timestampToDate,
  transformToCastEvent,
  transformToCastReactionEvent,
  transformToLinkEvent,
  transformToUrlReactionEvent,
  transformToUserDataEvent,
  transformToUsernameProofEvent,
  transformToVerificationEvent,
} from "@nook/common/farcaster";
import { FarcasterEventType } from "@nook/common/types";
import { publishEvent } from "@nook/common/queues";

export class FarcasterEventProcessor {
  private client: PrismaClient;
  private hub: HubRpcClient;

  constructor() {
    this.client = new PrismaClient();
    this.hub = getSSLHubRpcClient(process.env.HUB_RPC_ENDPOINT as string);
  }

  async process(message: Message) {
    switch (message.data?.type) {
      case MessageType.CAST_ADD: {
        await this.processCastAdd(message);
        break;
      }
      case MessageType.CAST_REMOVE: {
        await this.processCastRemove(message);
        break;
      }
      case MessageType.LINK_ADD: {
        await this.processLinkAdd(message);
        break;
      }
      case MessageType.LINK_REMOVE: {
        await this.processLinkRemove(message);
        break;
      }
      case MessageType.REACTION_ADD: {
        await this.processCastReactionAdd(message);
        break;
      }
      case MessageType.REACTION_REMOVE: {
        await this.processCastReactionRemove(message);
        break;
      }
      case MessageType.VERIFICATION_ADD_ETH_ADDRESS: {
        await this.processVerificationAdd(message);
        break;
      }
      case MessageType.VERIFICATION_REMOVE: {
        await this.processVerificationRemove(message);
        break;
      }
      case MessageType.USER_DATA_ADD: {
        await this.userDataAdd(message);
        break;
      }
      case MessageType.USERNAME_PROOF: {
        await this.usernameProofAdd(message);
        break;
      }
      default:
        console.log(`[farcaster] unknown message type: ${message.data?.type}`);
        break;
    }
  }

  async processCastAdd(message: Message) {
    const cast = messageToCast(message);
    if (!cast) return;

    if (cast.parentHash) {
      const { rootParentFid, rootParentHash, rootParentUrl } =
        await findRootParent(this.hub, cast);
      cast.rootParentFid = rootParentFid;
      cast.rootParentHash = rootParentHash;
      cast.rootParentUrl = rootParentUrl;
    }

    await this.client.farcasterCast.upsert({
      where: {
        hash: cast.hash,
      },
      create: cast as Prisma.FarcasterCastCreateInput,
      update: cast as Prisma.FarcasterCastCreateInput,
    });

    const embedCasts = messageToCastEmbedCast(message);

    for (const embedCast of embedCasts) {
      await this.client.farcasterCastEmbedCast.upsert({
        where: {
          hash_embedHash: {
            hash: embedCast.hash,
            embedHash: embedCast.embedHash,
          },
        },
        create: embedCast,
        update: embedCast,
      });
    }

    const embedUrls = messageToCastEmbedUrl(message);

    for (const embedUrl of embedUrls) {
      await this.client.farcasterCastEmbedUrl.upsert({
        where: {
          hash_url: {
            hash: embedUrl.hash,
            url: embedUrl.url,
          },
        },
        create: embedUrl,
        update: embedUrl,
      });
    }

    const mentions = messageToCastMentions(message);

    for (const mention of mentions) {
      await this.client.farcasterCastMention.upsert({
        where: {
          hash_mention_mentionPosition: {
            hash: mention.hash,
            mention: mention.mention,
            mentionPosition: mention.mentionPosition,
          },
        },
        create: mention,
        update: mention,
      });
    }

    console.log(`[cast-add] [${cast.fid}] added ${cast.hash}`);

    publishEvent(transformToCastEvent(FarcasterEventType.CAST_ADD, cast));

    return cast;
  }

  async processCastRemove(message: Message) {
    if (!message.data?.castRemoveBody) return;

    const hash = bufferToHex(message.data.castRemoveBody.targetHash);
    const deletedAt = timestampToDate(message.data.timestamp);

    await this.client.farcasterCast.updateMany({
      where: { hash },
      data: { deletedAt },
    });

    await this.client.farcasterCastEmbedCast.updateMany({
      where: { hash },
      data: { deletedAt },
    });

    await this.client.farcasterCastEmbedUrl.updateMany({
      where: { hash },
      data: { deletedAt },
    });

    await this.client.farcasterCastMention.updateMany({
      where: { hash },
      data: { deletedAt },
    });

    console.log(`[cast-remove] [${message.data?.fid}] removed ${hash}`);

    const cast = await this.client.farcasterCast.findUnique({
      where: { hash },
    });
    if (cast) {
      publishEvent(transformToCastEvent(FarcasterEventType.CAST_REMOVE, cast));
    }

    return cast;
  }

  async processLinkAdd(message: Message) {
    const link = messageToLink(message);
    if (!link) return;

    await this.client.farcasterLink.upsert({
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

    publishEvent(transformToLinkEvent(FarcasterEventType.LINK_ADD, link));

    return link;
  }

  async processLinkRemove(message: Message) {
    const link = messageToLink(message);
    if (!link) return;

    const existingLink = await this.client.farcasterLink.findUnique({
      where: {
        fid_linkType_targetFid: {
          fid: link.fid,
          linkType: link.linkType,
          targetFid: link.targetFid,
        },
      },
    });

    await this.client.farcasterLink.updateMany({
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

    if (existingLink) {
      publishEvent(transformToLinkEvent(FarcasterEventType.LINK_REMOVE, link));
    }

    return link;
  }

  async processCastReactionAdd(message: Message) {
    const reaction = messageToCastReaction(message);
    if (!reaction) return;

    await this.client.farcasterCastReaction.upsert({
      where: {
        targetHash_reactionType_fid: {
          targetHash: reaction.targetHash,
          reactionType: reaction.reactionType,
          fid: reaction.fid,
        },
      },
      create: reaction,
      update: reaction,
    });

    console.log(
      `[reaction-add] [${reaction.fid}] added ${reaction.reactionType} from ${reaction.targetHash}`,
    );

    publishEvent(
      transformToCastReactionEvent(
        FarcasterEventType.CAST_REACTION_ADD,
        reaction,
      ),
    );

    return reaction;
  }

  async processCastReactionRemove(message: Message) {
    const reaction = messageToCastReaction(message);
    if (!reaction) return;

    const existingReaction = await this.client.farcasterCastReaction.findUnique(
      {
        where: {
          targetHash_reactionType_fid: {
            targetHash: reaction.targetHash,
            reactionType: reaction.reactionType,
            fid: reaction.fid,
          },
        },
      },
    );

    await this.client.farcasterCastReaction.updateMany({
      where: {
        targetHash: reaction.targetHash,
        reactionType: reaction.reactionType,
        fid: reaction.fid,
      },
      data: {
        deletedAt: reaction.timestamp,
      },
    });

    console.log(
      `[reaction-remove] [${reaction.fid}] removed ${reaction.reactionType} from ${reaction.targetHash}`,
    );

    if (existingReaction) {
      publishEvent(
        transformToCastReactionEvent(
          FarcasterEventType.CAST_REACTION_REMOVE,
          existingReaction,
        ),
      );
    }

    return existingReaction;
  }

  async processUrlReactionAdd(message: Message) {
    const reaction = messageToUrlReaction(message);
    if (!reaction) return;

    await this.client.farcasterUrlReaction.upsert({
      where: {
        targetUrl_reactionType_fid: {
          targetUrl: reaction.targetUrl,
          reactionType: reaction.reactionType,
          fid: reaction.fid,
        },
      },
      create: reaction,
      update: reaction,
    });

    console.log(
      `[reaction-add] [${reaction.fid}] added ${reaction.reactionType} from ${reaction.targetUrl}`,
    );

    publishEvent(
      transformToUrlReactionEvent(
        FarcasterEventType.URL_REACTION_ADD,
        reaction,
      ),
    );

    return reaction;
  }

  async processUrlReactionRemove(message: Message) {
    const reaction = messageToUrlReaction(message);
    if (!reaction) return;

    const existingReaction = await this.client.farcasterUrlReaction.findUnique({
      where: {
        targetUrl_reactionType_fid: {
          targetUrl: reaction.targetUrl,
          reactionType: reaction.reactionType,
          fid: reaction.fid,
        },
      },
    });

    await this.client.farcasterUrlReaction.updateMany({
      where: {
        targetUrl: reaction.targetUrl,
        reactionType: reaction.reactionType,
        fid: reaction.fid,
      },
      data: {
        deletedAt: reaction.timestamp,
      },
    });

    console.log(
      `[reaction-remove] [${reaction.fid}] removed ${reaction.reactionType} from ${reaction.targetUrl}`,
    );

    if (existingReaction) {
      publishEvent(
        transformToUrlReactionEvent(
          FarcasterEventType.URL_REACTION_REMOVE,
          existingReaction,
        ),
      );
    }

    return existingReaction;
  }

  async processVerificationAdd(message: Message) {
    const verification = messageToVerification(message);
    if (!verification) return;

    await this.client.farcasterVerification.upsert({
      where: {
        fid_address: {
          fid: verification.fid,
          address: verification.address,
        },
      },
      create: verification,
      update: verification,
    });

    console.log(
      `[verification-add] [${verification.fid}] added ${verification.address}`,
    );

    publishEvent(
      transformToVerificationEvent(
        FarcasterEventType.VERIFICATION_ADD,
        verification,
      ),
    );

    return verification;
  }

  async processVerificationRemove(message: Message) {
    if (!message.data?.verificationRemoveBody?.address) return;

    const fid = BigInt(message.data.fid);
    const address = bufferToHexAddress(
      message.data.verificationRemoveBody.address,
    );
    const protocol = message.data.verificationRemoveBody.protocol;

    await this.client.farcasterVerification.updateMany({
      where: {
        fid,
        address,
      },
      data: {
        deletedAt: timestampToDate(message.data.timestamp),
      },
    });

    console.log(`[verification-remove] [${fid}] removed ${address}`);

    const verification = await this.client.farcasterVerification.findFirst({
      where: { address, protocol },
    });

    if (verification) {
      publishEvent(
        transformToVerificationEvent(
          FarcasterEventType.VERIFICATION_REMOVE,
          verification,
        ),
      );
    }

    return verification;
  }

  async userDataAdd(message: Message) {
    const userData = messageToUserData(message);
    if (!userData) return;

    await this.client.farcasterUserData.upsert({
      where: {
        fid_type: {
          fid: userData.fid,
          type: userData.type,
        },
      },
      create: userData,
      update: userData,
    });

    console.log(
      `[user-data-add] [${userData.fid}] added ${userData.type} with value ${userData.value}`,
    );

    publishEvent(transformToUserDataEvent(userData));

    return userData;
  }

  async usernameProofAdd(message: Message) {
    if (!message?.data?.usernameProofBody) return;
    const proof = messageToUsernameProof(message.data.usernameProofBody);

    await this.client.farcasterUsernameProof.upsert({
      where: {
        username: proof.username,
      },
      create: proof,
      update: proof,
    });

    console.log(`[username-proof-add] [${proof.fid}] added ${proof.username}`);

    publishEvent(transformToUsernameProofEvent(proof));

    return proof;
  }
}