import { StudentDao } from "../dao/student.dao";
import { StudentSaveDto } from "../dto/studentSaveDto";
import { StudentDetailsDto } from "../dto/studentDetailsDto";
import { GroupService } from "./group.service";

/** Сервіс для роботи з студетами */ 
export class StudentService {
  
  /** Створення нового студента */  
  static async createStudent(dto: StudentSaveDto): Promise<number> {
    const validatedDto = await this.validateNewStudent(dto);
    const newStudentId = await StudentDao.createStudent(validatedDto);
    return newStudentId;
  }
  
  /** Валідація інфо про нового студента */
  static async validateNewStudent(dto: StudentSaveDto): Promise<StudentSaveDto> {
    if (!dto.name || !dto.surname || !dto.birthDate) {
      throw new Error("Поля 'name', 'surname' та 'birthDate' обов'язкові.");
    }
    if (dto.groupId === undefined || dto.groupId === null) {
      throw new Error("Поле 'groupId' є обов'язковим.");
    }
    if (typeof dto.name !== "string" || typeof dto.surname !== "string") {
      throw new Error("'name' та 'surname' мають бути типу string.");
    }
    if (typeof dto.groupId !== "number" || isNaN(dto.groupId) || dto.groupId <= 0) {
      throw new Error("'groupId' має бути позитивним числом.");
    }
    let parsedDate: Date;
    if (typeof dto.birthDate === "string") {
      parsedDate = new Date(dto.birthDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Невірний формат дати для 'birthDate'.");
      }
    } else {
      parsedDate = dto.birthDate;
    }
    const groupExists = await GroupService.groupExists(dto.groupId);
    if (!groupExists) {
      throw new Error(`Група з ідентифікатором ${dto.groupId} не існує.`);
    }
    return {
      ...dto,
      birthDate: parsedDate
    };
  }

  /** Отримання студента по ід */
  static async getStudentById(id: number): Promise<StudentDetailsDto | null> {
    const studentRow = await StudentDao.findStudentWithGroupById(id);
    if (!studentRow) {
      return null;
    }
    return this.toStudentDetailsDto(studentRow);
  }

  /** Конвертація сутності студента в 'StudentDetailsDto' */
  private static toStudentDetailsDto(row: any): StudentDetailsDto {
    return {
      id: row.id,
      name: row.name,
      surname: row.surname,
      birthDate: new Date(row.birthDate),
      email: row.email,
      phone: row.phone,
      group: row.group_id
        ? {
            id: row.group_id,
            name: row.group_name,
            curator: row.group_curator
          }
        : undefined
    };
  }

  /** Оновлення інфо студента */
  static async updateStudent(
    id: number,
    name: string,
    surname: string,
    birthDate: string | Date,
    email: string,
    phone: string,
    groupId: number
  ): Promise<any> {
    const { parsedDate } = await this.validateUpdateStudent(id, name, surname, birthDate, groupId);
    const updatedRow = await StudentDao.updateStudent(
      id,
      name,
      surname,
      parsedDate,
      email,
      phone,
      groupId
    );
    if (!updatedRow) {
      throw new Error("Студента не знайдено");
    }
    return {
      id: updatedRow.id,
      name: updatedRow.name,
      surname: updatedRow.surname,
      birthDate: updatedRow.birthDate,
      groupId: updatedRow.group_id
    };
  }

  /** Видалення студента по ід */
  static async deleteStudent(id: number): Promise<void> {
    const deletedCount = await StudentDao.deleteStudent(id);
    if (deletedCount === 0) {
      throw new Error("Студента не знайдено за вказаним id");
    }
  }

  /** Завантаження масиву дто студентів */
  static async uploadStudents(students: StudentSaveDto[]): Promise<number> {
    const transaction = await StudentDao.startTransaction();
    try {
      let count = 0;
      for (const studentData of students) {
        // Викликаємо асинхронну валідацію
        const validated = await this.validateNewStudent(studentData);
        // Якщо не викинуто помилку – зберігаємо в межах транзакції
        await StudentDao.createStudent(validated, transaction);
        count++;
      }
      await transaction.commit();
      return count;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** Валідація студента при оновленні його інфо */
  private static async validateUpdateStudent(
    currentStudentId: number,
    name: string,
    surname: string,
    birthDate: string | Date,
    groupId: number
  ): Promise<{ parsedDate: Date }> {
    if (!name || !surname || !birthDate) {
      throw new Error("Поля 'name', 'surname' та 'birthDate' є обов'язковими.");
    }
    if (!groupId) {
      throw new Error("Поле 'groupId' є обов'язковим.");
    }
    let parsedDate: Date;
    if (typeof birthDate === "string") {
      parsedDate = new Date(birthDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Невірний формат дати для 'birthDate'.");
      }
    } else {
      parsedDate = birthDate;
    }
    const duplicate = await StudentDao.findDuplicateByNameSurnameBirthDate(
      name,
      surname,
      parsedDate,
      currentStudentId
    );
    if (duplicate) {
      throw new Error("Студент з такими ім'ям, прізвищем та датою народження вже існує.");
    }
    const groupExists = await GroupService.groupExists(groupId);
    if (!groupExists) {
      throw new Error("Група з таким ID не існує.");
    }
    return { parsedDate };
  }

}

