import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Очищаємо таблицю
  await knex("students").del();
  await knex("groups").del();

  // Наповнюємо групи
  await knex("groups").insert([
    { name: "Group 1", curator: "Roman Fedoriv" },
    { name: "Group 2", curator: "Natalia Davidenko" },
    { name: "Group 3", curator: "Andriy Boyko"}
  ]);
}