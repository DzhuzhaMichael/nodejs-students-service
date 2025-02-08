import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("groups", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable().unique();
    table.string("curator").notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("groups");
}
