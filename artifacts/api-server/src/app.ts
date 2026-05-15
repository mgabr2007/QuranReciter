import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const devDomain = process.env["REPLIT_DEV_DOMAIN"];
  if (devDomain) {
    origins.add(`https://${devDomain}`);
  }

  const expoDomain = process.env["REPLIT_EXPO_DEV_DOMAIN"];
  if (expoDomain) {
    origins.add(`https://${expoDomain}`);
  }

  const productionDomains = process.env["REPLIT_DOMAINS"];
  if (productionDomains) {
    for (const domain of productionDomains.split(",")) {
      const trimmed = domain.trim();
      if (trimmed) origins.add(`https://${trimmed}`);
    }
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
