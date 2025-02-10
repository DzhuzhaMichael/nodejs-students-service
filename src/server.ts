import app from "./app";
import { RabbitMQ } from "./utils/rabbitmq";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  // Підключаємо RabbitMQ
  await RabbitMQ.connect();
  // Запускаємо прослуховування повідомлень (наприклад, для черги "group_created")
  await RabbitMQ.consumeMessages("group_created");

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
bootstrap().catch(err => {
  console.error("Помилка при старті серверу:", err);
});
