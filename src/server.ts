import app from "./app";
import { RabbitMQ } from "./utils/rabbitmq";
import { config } from "./config";

async function bootstrap() {
  // Підключаємо RabbitMQ
  await RabbitMQ.connect();
  // Запускаємо прослуховування повідомлень
  await RabbitMQ.consumeMessages("group_created");

  app.listen(config.port, () => {
    console.log(`Server запущено на порту: ${config.port}`);
    console.log(`RabbitMQ запущено на порту: ${config.rabbit.port}`);
  });
}
bootstrap().catch(err => {
  console.error("Помилка при старті серверу:", err);
});
