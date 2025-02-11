import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
    development: {
      client: "pg",
      connection: {
        host: "127.0.0.1",
        port: 5432,
        user: "postgres",
        password: "lbcWqh88",
        database: "students-service"
      },
      migrations: {
        directory: "migrations"
      },
      seeds: {
        directory: "seeds"
      }
    },
    test: {
      client: "pg",
      connection: {
        host: "127.0.0.1",
        port: 5432,
        user: "postgres",
        password: "lbcWqh88",
        database: "students-service-test"
      },
      migrations: {
        directory: "./src/database/migrations"
      },
      seeds: {
        directory: "./src/database/seeds"
      }
    }
  };
  
  export default config[process.env.NODE_ENV || "development"];
