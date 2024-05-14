import { FastifyInstance } from "fastify";
import { PrismaClient } from "@nook/common/prisma/lists";
import {
  CreateListRequest,
  UpdateListRequest,
  ListItem,
} from "@nook/common/types";

export class ListsService {
  private client: PrismaClient;

  constructor(fastify: FastifyInstance) {
    this.client = fastify.lists.client;
  }

  async getCreatedLists(creatorId: number) {
    return await this.client.list.findMany({
      where: {
        creatorId,
      },
      include: {
        items: true,
      },
    });
  }

  async getFollowedLists(userId: number) {
    return await this.client.list.findMany({
      where: {
        followers: {
          some: {
            userId,
          },
        },
      },
      include: {
        items: true,
      },
    });
  }

  async getList(listId: string) {
    return await this.client.list.findUnique({
      where: {
        id: listId,
      },
      include: {
        items: true,
      },
    });
  }

  async createList(creatorId: number, list: CreateListRequest) {
    return await this.client.list.create({
      data: {
        creatorId,
        type: list.type,
        name: list.name,
        description: list.description,
        imageUrl: list.imageUrl,
        visibility: list.visibility,
        followers: {
          create: {
            userId: creatorId,
          },
        },
      },
    });
  }

  async updateList(listId: string, list: UpdateListRequest) {
    return this.client.list.update({
      where: {
        id: listId,
      },
      data: {
        name: list.name,
        description: list.description,
        imageUrl: list.imageUrl,
        visibility: list.visibility,
      },
    });
  }

  async deleteList(listId: string) {
    return this.client.list.updateMany({
      where: {
        id: listId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addItem(item: ListItem) {
    return this.client.list.update({
      where: {
        id: item.listId,
      },
      data: {
        itemCount: {
          increment: 1,
        },
        items: {
          connectOrCreate: {
            where: {
              listId_type_id: {
                listId: item.listId,
                type: item.type,
                id: item.id,
              },
            },
            create: {
              type: item.type,
              id: item.id,
            },
          },
        },
      },
    });
  }

  async removeItem(item: ListItem) {
    return this.client.listItem.deleteMany({
      where: {
        listId: item.listId,
        type: item.type,
        id: item.id,
      },
    });
  }
}