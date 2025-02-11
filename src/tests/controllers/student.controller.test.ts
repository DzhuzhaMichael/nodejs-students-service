import knex from "knex";
import request from "supertest";
import app from "../../app";
import config from "../../database/knexfile";

const db = knex(config);

jest.mock("../../utils/rabbitmq");

describe("StudentController (Integration Tests)", () => {
  beforeAll(async () => {
    console.log("Використовується БД:", process.env.NODE_ENV);
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db.raw("TRUNCATE TABLE students, groups RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    try {
      await db.raw("TRUNCATE TABLE students, groups RESTART IDENTITY CASCADE");
      await db.destroy();
      console.log("Таблиці для студентів очищені, з'єднання з БД закрито!");
    } catch (err) {
      console.error("Помилка при закритті підключення до БД:", err);
    }
  });

  describe("POST /api/student", () => {
    it("створення нового студента при валідних даних", async () => {
      const [group] = await db("groups")
        .insert({ name: "GroupForStudent", curator: "Test Curator" })
        .returning(["id"]);

      const groupId = group.id;

      const res = await request(app)
        .post("/api/student")
        .send({
          name: "Ivan",
          surname: "Shevchenko",
          birthDate: "2000-01-01",
          email: "is@example.com",
          phone: "+380633456789",
          groupId: groupId
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("message", "Студента створено");

      const studentId = res.body.id;

      const createdStudent = await db("students").where({ id: studentId }).first();
      expect(createdStudent).toMatchObject({
        name: "Ivan",
        surname: "Shevchenko",
        email: "is@example.com",
        phone: "+380633456789"
      });
    });

    it("повертає помилку, якщо поле groupId відсутнє", async () => {
      const res = await request(app)
        .post("/api/student")
        .send({
          name: "Bogdan",
          surname: "Bogdanov",
          birthDate: "2001-01-01"
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Поле 'groupId' є обов'язковим."); 
    });
  });

  describe("GET /api/student/:id", () => {
    it("повертає 404, якщо студент не знайдений", async () => {
      const res = await request(app).get("/api/student/9999");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Студента не знайдено");
    });

    it("повертає студента, якщо студент існує", async () => {
      const [group] = await db("groups").insert({ name: "AnotherGroup", curator: "Test Curator" }).returning(["id"]);
      const groupId = group.id;
      const [student] = await db("students").insert({
        name: "Petro",
        surname: "Petrov",
        birthDate: "1990-05-05",
        email: "pp@example.com",
        phone: "+380987654321",
        group_id: groupId
      }).returning("id");
      const studentId = student.id;

      const res = await request(app).get(`/api/student/${studentId}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: studentId,
        name: "Petro",
        surname: "Petrov",
        email: "pp@example.com",
        phone: "+380987654321",
        group: {
          id: group.id,
        }
      });
    });
  });

  describe("PUT /api/student/:id", () => {
    it("оновлює дані студента", async () => {
      const [group] = await db("groups").insert({ name: "GroupX", curator: "C" }).returning(["id"]);
      
      const groupId = group.id;
      
      const [student] = await db("students").insert({
        name: "Andriy",
        surname: "Andreev",
        birthDate: "1995-05-05",
        email: "aa@example.com",
        phone: "+380503450000",
        group_id: groupId
      }).returning("id");

      const sudentId = student.id;

      const res = await request(app)
        .put(`/api/student/${sudentId}`)
        .send({
          name: "Semen",
          surname: "Semenov",
          birthDate: "1995-05-05",
          email: "ss@example.com",
          phone: "+380503450001",
          groupId: group.id
        });  
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Інформацію про студента успішно оновлено");
      expect(res.body.updatedData).toMatchObject(
        expect.objectContaining({
            name: "Semen",
            surname: "Semenov"
          })
      );
    });

    it("повертає 404, якщо студента не знайдено", async () => {
      const [group] = await db("groups").insert({ name: "Group T", curator: "Alex Alexeev" }).returning(["id"]);
      const groupId = group.id;  
      const res = await request(app)
        .put(`/api/student/999`)
        .send({
          name: "Pavlo",
          surname: "Pavlenko",
          birthDate: "2000-02-02",
          email: "pp@example.com",
          phone: "+380671222333",
          groupId: groupId
        }); 
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Студента не знайдено");
    });
  });

  describe("DELETE /api/student/:id", () => {
    it("видаляє існуючого студента", async () => {
      const [group] = await db("groups").insert({ name: "GroupDel", curator: "Test" }).returning(["id"]);
      const groupId = group.id;
      const [student] = await db("students").insert({
        name: "Mykola",
        surname: "Mykolchenko",
        birthDate: "1980-03-03",
        email: "mm@example.com",
        phone: "+380999888777",
        group_id: groupId
      }).returning("id");

      const studentId = student.id;

      const res = await request(app).delete(`/api/student/${studentId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Студента видалено");

      const stud = await db("students").where({ id: studentId }).first();
      expect(stud).toBeFalsy();
    });

    it("повертає 404, якщо студента не знайдено", async () => {
      const res = await request(app).delete(`/api/student/9999`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Студента не знайдено за вказаним id");
    });
  });

  describe("POST /api/student/upload", () => {
    it("імпортує масив студентів", async () => {
      const [group] = await db("groups").insert({ name: "ImportGroup", curator: "Imp Curator" }).returning(["id"]);
      const groupId = group.id;
      const studentsData = [
        {
          name: "Ilya",
          surname: "Ilyenko",
          birthDate: "1995-05-05",
          email: "ii@example.com",
          phone: "+380633450111",
          groupId: groupId
        },
        {
          name: "Viktor",
          surname: "Viktorov",
          birthDate: "1996-06-06",
          email: "vv@example.com",
          phone: "+380503450222",
          groupId: groupId
        }
      ];
      
      const res = await request(app)
        .post("/api/student/upload")
        .send({ students: studentsData });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Імпортовано 2 студентів");

      const dbStudents = await db("students").select("*").where({ group_id: group.id });
      expect(dbStudents.length).toBe(2);
      expect(dbStudents[0]).toMatchObject({ name: "Ilya" });
      expect(dbStudents[1]).toMatchObject({ name: "Viktor" });
    });

    it("повертає 400, якщо в body не масив студентів", async () => {
      const res = await request(app)
        .post("/api/student/upload")
        .send({ students: "not an array" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Невірні дані для імпорту. Очікується масив студентів.");
    });
  });

  describe("POST /api/student/_list", () => {
    it("повертає список студентів згідно фільтра name та groupId", async () => {
      const [groupFirst] = await db("groups").insert({ name: "Group A", curator: "Artem Artemov" }).returning(["id"]);
      const groupFirstId = groupFirst.id;  
      const [groupSecond] = await db("groups").insert({ name: "Group B", curator: "Igor Igorev" }).returning(["id"]);
      const groupSecondId = groupSecond.id;  

      await db("students").insert({
        name: "Vlad",
        surname: "Vladov",
        birthDate: "1999-01-01",
        email: "vv@example.com",
        phone: "+380971111111",
        group_id: groupFirstId
      });
      await db("students").insert({
        name: "Kiril",
        surname: "Kirilyk",
        birthDate: "1999-02-02",
        email: "kk@example.com",
        phone: "+380502222222",
        group_id: groupSecondId
      });

      const res = await request(app)
        .post("/api/student/_list")
        .send({
          name: "Vlad",
          groupId: groupFirstId, 
          page: 1,
          size: 10
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("list");
      expect(res.body).toHaveProperty("totalPages");
      expect(res.body.list.length).toBe(1);
      expect(res.body.list[0]).toMatchObject({ name: "Vlad" });
    });
  });
});
