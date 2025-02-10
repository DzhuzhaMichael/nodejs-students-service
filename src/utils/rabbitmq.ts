import amqplib, { Channel, Connection } from "amqplib";
import { config } from "../config";

/** Клас для роботи з RabbitMQ */
export class RabbitMQ {
  
  private static connection: Connection;
  private static channel: Channel;

  /** Підключення та створення нового каналу */
  static async connect(rabbitConfig = config.rabbit): Promise<void> {
    const { host, port, user, pass } = rabbitConfig;
    const url = `amqp://${user}:${pass}@${host}:${port}`;
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    console.log("RabbitMQ: з’єднання встановлено");
  }

  /** Публікація повідомлення у вказану чергу */
  static publishMessage(queueName: string, data: any): void {
    if (!this.channel) {
      console.error("RabbitMQ: Канал не ініціалізований. Повідомлення не надіслано.");
      return;
    }
    this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true
    });
  }

  /** Отримання повідомлень із вказаної черги */
  static async consumeMessages(queueName: string): Promise<void> {
    if (!this.channel) {
      console.error("RabbitMQ: Канал не ініціалізований. Отримання повідомлень неможливе.");
      return;
    }
    // Створюємо/гарантуємо існування черги
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          // Обробляємо контент
          const content = JSON.parse(msg.content.toString());
          // Перевіряємо або генеруємо id повідомлення для ідемпотентності
          const messageId = content.uniqueMessageId || content.id;
          // Перевірка ідемпотентності
          if (MessageProcessor.hasAlreadyProcessed(messageId)) {
            // Якщо вже обробляли, пропускаємо
            console.log(`Повідомлення (ID=${messageId}) з черги RabbitMQ вже оброблене. Пропускаємо...`);
            this.channel.ack(msg);
            return;
          }
          // Логіка обробки: логування
          console.log("З черги RabbitMQ отримано нове повідомлення про створення групи:", content);
          // Позначаємо, що повідомлення оброблено
          MessageProcessor.markProcessed(messageId);
          // Підтверджуємо RabbitMQ, що повідомлення успішно оброблено
          this.channel.ack(msg);
        } catch (err) {
          console.error("Помилка під час обробки повідомлення з черги RabbitMQ:", err);
          this.channel.nack(msg, false, false);
        }
      }
    }, { noAck: false });
  }
}

/** Клас для локального зберігання ID повідомлень при роботі з RabbitMQ (забезпечення ідемпотентності) */
class MessageProcessor {

  private static processedIds = new Set<string>();

  static hasAlreadyProcessed(id: string): boolean {
    return this.processedIds.has(id);
  }

  static markProcessed(id: string): void {
    this.processedIds.add(id);
  }
}
