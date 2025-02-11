export class RabbitMQ {
    static async connect() {
      console.log("Mocked RabbitMQ: connect()");
    }
  
    static async publishMessage(queueName: string, data: any) {
      console.log(`Mocked RabbitMQ: publishMessage(${queueName}, ${JSON.stringify(data)})`);
    }
  
    static async consumeMessages(queueName: string) {
      console.log(`Mocked RabbitMQ: consumeMessages(${queueName})`);
    }
  }
  