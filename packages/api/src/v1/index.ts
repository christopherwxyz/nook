import { nftRoutes } from "./routes/nft";
import { listRoutes } from "./routes/list";
import { settingsRoutes } from "./routes/settings";
import { tokenRoutes } from "./routes/token";
import { userRoutes } from "./routes/user";
import { FastifyInstance } from "fastify";
import { transactionRoutes } from "./routes/transaction";

export const registerV1Routes = async (fastify: FastifyInstance) => {
  fastify.register(userRoutes, { prefix: "/v1" });
  fastify.register(settingsRoutes, { prefix: "/v1" });
  fastify.register(listRoutes, { prefix: "/v1" });
  fastify.register(nftRoutes, { prefix: "/v1" });
  fastify.register(transactionRoutes, { prefix: "/v1" });
  fastify.register(tokenRoutes, { prefix: "/v1" });
};
