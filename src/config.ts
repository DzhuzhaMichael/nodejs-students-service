import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  rabbit: {
    host: process.env.RABBIT_HOST || "localhost",
    port: process.env.RABBIT_PORT || "5672",
    user: process.env.RABBIT_USER || "guest",
    pass: process.env.RABBIT_PASS || "guest"
  }
};
