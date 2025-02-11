import knex from "knex";
import request from "supertest";
import app from "../../app";
import config from "../../database/knexfile";

const db = knex(config);

jest.mock("../../utils/rabbitmq");

describe("GroupController (Integration Tests)", () => {
  beforeAll(async () => {
    console.log("Використовується БД:", process.env.NODE_ENV);
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db.raw("TRUNCATE TABLE students, groups RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    try {
      console.log("Очистка перед виходом...");
      await db.raw("TRUNCATE TABLE students, groups RESTART IDENTITY CASCADE");
      await db.destroy();
      console.log("Тестова БД очищена!");
    } catch (err) {
      console.error("Помилка при закритті підключення до БД:", err);
    }
  });

  describe("GET /api/group", () => {
    it("повертає порожній список, якщо немає записів", async () => {

      const res = await request(app).get("/api/group");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("повертає список груп, якщо записи є", async () => {
      await request(app)
        .post("/api/group")
        .send({ name: "Group A", curator: "Roman Romanov" })
        .expect(201);

      const res = await request(app).get("/api/group");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toMatchObject({
        name: "Group A",
        curator: "Roman Romanov"
      });
    });
  });

  describe("POST /api/group", () => {
    it("створює нову групу при валідних даних", async () => {

      const res = await request(app)
        .post("/api/group")
        .send({ name: "Group B", curator: "Ivan Ivanov" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("message", "Групу створено");
    });

    it("повертає помилку, якщо group з таким name вже існує", async () => {
      await request(app)
        .post("/api/group")
        .send({ name: "Group C", curator: "Alex Alexeev" })
        .expect(201);

      const res = await request(app)
        .post("/api/group")
        .send({ name: "Group C", curator: "Alex Alexeev" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Група з таким ім'ям вже існує в БД");
    });
  });

  describe("PUT /api/group/:id", () => {
    it("оновлює існуючу групу", async () => {
      const [group] = await db("groups")
        .insert({ name: "Group D", curator: "Pertro Petriv" })
        .returning(["id"]);
      
      const groupId = group.id;  

      const res = await request(app)
        .put(`/api/group/${groupId}`)
        .send({ name: "Group E", curator: "Pavlo Pavliv" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Інформацію про групу успішно оновлено");
      expect(res.body.data).toMatchObject({
        name: "Group E",
        curator: "Pavlo Pavliv"
      });
    });

    it("повертає 400, якщо `name` або `curator` відсутні", async () => {
      const res = await request(app)
        .put(`/api/group/999`)
        .send({ name: "", curator: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/group/:id", () => {
    it("видаляє існуючу групу", async () => {
      const [group] = await db("groups")
        .insert({ name: "Group F", curator: "Andriy Andreev" })
        .returning(["id"]);
  
      const groupId = group.id;
  
      const res = await request(app).delete(`/api/group/${groupId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Групу успішно видалено");
  
      const deletedGroup = await db("groups").where({ id: groupId }).first();
      expect(deletedGroup).toBeFalsy();
    });
  
    it("повертає 404, якщо групу не знайдено", async () => {
      const res = await request(app).delete("/api/group/9999");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Групу не знайдено за вказаним id");
    });
  });
  

  describe("GET /api/group/top", () => {
    it("повертає top групи із найбільшою кількістю студентів", async () => {
      await db("groups").insert({ name: "Group G", curator: "Lev Lviv" });
      await db("groups").insert({ name: "Group H", curator: "Oleg Olegiv" });
      await db("groups").insert({ name: "Group I", curator: "Yuriy Yuriyv" });

      await db("students").insert({ name: "Nikolay", surname: "Nikolenko", birthDate: "2000-01-01", email: "nn@example.com", phone: "+380631234567", group_id: 1 });
      await db("students").insert({ name: "Kindrat", surname: "Kindrativ", birthDate: "2000-01-01", email: "kk@example.com", phone: "+380631234568", group_id: 1 });
      await db("students").insert({ name: "Stepan", surname: "Stepanenko", birthDate: "2000-01-01", email: "ss@example.com", phone: "+380631234569", group_id: 2 });

      const res = await request(app).get("/api/group/top?n=2");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toMatchObject({ name: "Group G", count: 2 });
      expect(res.body[1]).toMatchObject({ name: "Group H", count: 1 });
    });
  });
});
