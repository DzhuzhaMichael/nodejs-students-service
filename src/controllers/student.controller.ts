import { Request, Response } from "express";
import knex from "knex";
import config from "../database/knexfile";
import { StudentService } from "../services/student.service";
import { StudentSaveDto } from "../dto/studentSaveDto"; 

const db = knex(config.development);

export class StudentController {

  static async createStudent(req: Request, res: Response) {
    try {
      const { name, surname, birthDate, email, phone, groupId } = req.body;
      const dto: StudentSaveDto = {
        name,
        surname,
        birthDate,
        email,
        phone,
        groupId
      };
      const newStudentId = await StudentService.createStudent(dto);
      return res.status(201).json({
        id: newStudentId,
        message: "Студента створено"
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        error: error.message || "Виникла помилка при створенні нового студента"
      });
    }
  }

  static async getStudentById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const studentDto = await StudentService.getStudentById(id);
      if (!studentDto) {
        return res.status(404).json({ error: "Студента не знайдено" });
      }
      return res.status(200).json(studentDto);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Виникла помилка отримання даних студента" });
    }
  }

  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, surname, birthDate, email, phone, groupId } = req.body;
      const updatedData = await StudentService.updateStudent(
        Number(id),
        name,
        surname,
        birthDate,
        email,
        phone,
        Number(groupId)
      );
      return res.status(200).json({
        message: "Інформацію про студента успішно оновлено",
        updatedData
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === "Студента не знайдено") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
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
