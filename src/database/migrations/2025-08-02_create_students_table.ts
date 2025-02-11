import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("students", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("surname").notNullable();
    table.date("birthDate").notNullable();
    table.string("email").notNullable();
    table.string("phone").notNullable();
    
    // Зовнішній ключ на groups.id
    table.integer("group_id")
      .notNullable()
      .references("id")
      .inTable("groups")
      .onDelete("CASCADE");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("students");
}
