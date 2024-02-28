import { FastifyInstance } from "fastify";
import { NookService } from "../../services/nookService";

export const nookRoutes = async (fastify: FastifyInstance) => {
  fastify.register(async (fastify: FastifyInstance) => {
    const nookService = new NookService(fastify);

    fastify.post<{ Params: { nookId: string } }>(
      "/nooks/:nookId",
      async (request, reply) => {
        const nook = await nookService.getNook(request.params.nookId);
        return reply.send(nook);
      },
    );

    fastify.get("/channels", async (request, reply) => {
      const channels = await nookService.getChannels();
      return reply.send({ data: channels });
    });

    fastify.get<{ Params: { channelId: string } }>(
      "/channels/:channelId",
      async (request, reply) => {
        const channel = await nookService.getChannel(request.params.channelId);
        return reply.send(channel);
      },
    );
  });
};
