import fastify from "fastify";
import { farcasterPlugin, redisPlugin } from "./plugins";
import { castRoutes } from "./routes/cast";
import { userRoutes } from "./routes/user";
import { channelRoutes } from "./routes/channel";

const buildApp = () => {
  const app = fastify({
    logger: true,
    ajv: {
      customOptions: {
        allowUnionTypes: true,
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Automatically convert BigInts to strings when serializing to JSON
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  app.register(farcasterPlugin);
  app.register(redisPlugin);

  app.register(castRoutes, { prefix: "/v1" });
  app.register(userRoutes, { prefix: "/v1" });
  app.register(channelRoutes, { prefix: "/v1" });

  return app;
};

const start = async () => {
  const app = buildApp();
  try {
    const port = Number(process.env.PORT || "3001");
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Listening on :${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
