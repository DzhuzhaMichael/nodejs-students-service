import { Request, Response } from "express";
import knex from "knex";
import config from "../database/knexfile";

const db = knex(config.development);

export class StudentController {
  // Створення нового студента
  static async createStudent(req: Request, res: Response) {
    try {
      const { name, surname, birthDate, email, phone, groupId } = req.body;
      
      // Валідація даних запиту
      if (!name || !surname || !birthDate || !email || !phone || !groupId) {
        return res.status(400).json({ error: "Всі дані студента є обов'язковими для заповнення" });
      }

      const [newStudentId] = await db("students")
        .insert({
          name,
          surname,
          birthDate,
          email,
          phone,
          group_id: groupId
        })
        .returning("id");

      return res.status(201).json({ id: newStudentId, message: "Студента створено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при створенні нового студента" });
    }
  }

  // Отримання студента з деталями групи з БД
  static async getStudentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const student = await db("students")
        .select(
          "students.id",
          "students.name",
          "students.surname",
          "students.birthDate",
          "students.email",
          "students.phone",
          "groups.id as group_id",
          "groups.name as group_name",
          "groups.curator as group_curator"
        )
        .join("groups", "students.group_id", "=", "groups.id")
        .where("students.id", id)
        .first();

      if (!student) {
        return res.status(404).json({ error: "Студента не знайдено" });
      }

      return res.status(200).json({
        id: student.id,
        name: student.name,
        surname: student.surname,
        birthDate: student.birthDate,
        email: student.email,
        phone: student.phone,
        group: {
          id: student.group_id,
          name: student.group_name,
          curator: student.group_curator
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка отримання даних студента" });
    }
  }

  // Оновлення даних студента
  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, surname, birthDate, email, phone, groupId } = req.body;

      // Валідація даних запиту
      if (!name || !surname || !birthDate || !email || !phone || !groupId) {
        return res.status(400).json({ error: "Всі дані студента є обов'язковими для заповнення" });
      }

      const updatedRows = await db("students")
        .where({ id })
        .update({
          name,
          surname,
          birthDate,
          email,
          phone,
          group_id: groupId
        });

      if (!updatedRows) {
        return res.status(404).json({ error: "Студента не знайдено" });
      }

      return res.status(200).json({ message: "Дані студента оновлено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при оновленні даних студента" });
    }
  }

  // Видалення студента
  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedRows = await db("students").where({ id }).del();

      if (!deletedRows) {
        return res.status(404).json({ error: "Студента не знайдено" });
      }

      return res.status(200).json({ message: "Студента видалено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при видаленні студента" });
    }
  }

  // Імпорт студентів з JSON
  static async uploadStudents(req: Request, res: Response) {
    // Припустимо, що JSON-файл передається у "req.file" або в "req.body"
    // Тут можливі різні варіанти залежно від налаштувань:
    // - multipart/form-data
    // - text/json
    // Для прикладу, розглянемо, що JSON надходить як текст у полі "students"

    const trx = await db.transaction();
    try {
      const studentsData = req.body.students; // масив студентів із JSON

      if (!Array.isArray(studentsData)) {
        return res.status(400).json({ error: "Невірні дані для імпорту. Очікується масив студентів." });
      }

      for (const student of studentsData) {
        const { name, surname, birthDate, email, phone, groupId } = student;

        // Валідація
        if (!name || !surname || !birthDate || !email || !phone || !groupId) {
          // Якщо хоч один невалідний - відкат транзакції
          await trx.rollback();
          return res.status(400).json({ error: "Виникла помилка при валідації. Перевірте коректність даних." });
        }

        await trx("students").insert({
          name,
          surname,
          birthDate,
          email,
          phone,
          group_id: groupId
        });
      }

      await trx.commit();
      return res.status(200).json({ message: `Імпортовано ${studentsData.length} студентів` });
    } catch (error) {
      await trx.rollback();
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при імпорті. Здійснено rollback." });
    }
  }
}
