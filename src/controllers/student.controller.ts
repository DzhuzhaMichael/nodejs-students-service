import { Request, Response } from "express";
import knex from "knex";
import config from "../database/knexfile";
import { StudentService } from "../services/student.service";
import { StudentSaveDto } from "../dto/studentSaveDto";
import { StudentListRequestDto } from "../dto/StudentListRequestDto"; 

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

  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await StudentService.deleteStudent(Number(id));
      return res.status(200).json({ message: "Студента видалено" });
    } catch (error: any) {
      console.error(error);
      if (error.message === "Студента не знайдено за вказаним id") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({
        error: "Виникла помилка при видаленні студента"
      });
    }
  }

  static async uploadStudents(req: Request, res: Response) {
    try {
      const studentsData = req.body.students;
      if (!Array.isArray(studentsData)) {
        return res
          .status(400)
          .json({ error: "Невірні дані для імпорту. Очікується масив студентів." });
      }
      const importedCount = await StudentService.uploadStudents(
        studentsData as StudentSaveDto[]
      );
      return res
        .status(200)
        .json({ message: `Імпортовано ${importedCount} студентів` });
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ error: error.message || "Виникла помилка при імпорті" });
    }
  }

  static async listStudents(req: Request, res: Response) {
    try {
      const { name, groupId, page, size } = req.body as StudentListRequestDto;
      const pageNum = page || 1;
      const sizeNum = size || 20;
      const result = await StudentService.listStudents(name, groupId, pageNum, sizeNum);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        error: error.message || "Виникла помилка при отриманні списку студентів"
      });
    }
  }
  
}
