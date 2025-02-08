import express from "express";
import routes from "./routes";

const app = express();

// Мідлвар для роботи з JSON
app.use(express.json());

// Реєстрація роутів
app.use("/api", routes);

export default app;
