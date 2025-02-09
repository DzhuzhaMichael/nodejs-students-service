// src/dao/student.dao.ts

import knex from "knex";
import config from "../database/knexfile";
import { StudentSaveDto } from "../dto/studentSaveDto";

const db = knex(config.development);

export class StudentDao {

  static async createStudent(dto: StudentSaveDto): Promise<number> {
    const [newStudentId] = await db("students")
      .insert({
        name: dto.name,
        surname: dto.surname,
        birthDate: dto.birthDate,
        email: dto.email,
        phone: dto.phone,
        group_id: dto.groupId
      })
      .returning("id");

    return newStudentId;
  }

  static async findStudentWithGroupById(id: number): Promise<any | null> {
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
      .leftJoin("groups", "students.group_id", "=", "groups.id")
      .where("students.id", id)
      .first();
    return student || null;
  }

  static async findDuplicateByNameSurnameBirthDate(
    name: string,
    surname: string,
    birthDate: Date,
    excludeId?: number
  ): Promise<any | null> {
    let query = db("students")
      .where({ name, surname, birthDate });

    if (excludeId !== undefined) {
      query = query.whereNot("id", excludeId);
    }

    const conflict = await query.first();
    return conflict || null;
  }

  static async updateStudent(
    id: number,
    name: string,
    surname: string,
    birthDate: Date,
    email: string,
    phone: string,
    groupId: number
  ): Promise<any | null> {
    const [updatedRow] = await db("students")
      .where({ id })
      .update({
        name,
        surname,
        birthDate,
        email,
        phone,
        group_id: groupId
      })
      .returning(["id", "name", "surname", "birthDate", "group_id"]);
    return updatedRow || null;
  }

}
