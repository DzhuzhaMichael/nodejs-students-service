import { GroupDao } from "../dao/group.dao";
import { GroupDto } from "../dto/groupDto";
import { GroupSaveDto } from "../dto/groupSaveDto";

export class GroupService {
  
  static async listGroups(): Promise<GroupDto[]> {
    const groups = await GroupDao.listGroups();
    return groups.map((group: any) => this.toGroupDto(group));
  }

  private static toGroupDto(group: any): GroupDto {
    return {
      _id: group._id,
      name: group.name,
      curator: group.curator
    };
  }

  static async groupExists(groupId: number): Promise<boolean> {
    const groups = await GroupDao.listGroups();
    return groups.some(g => g.id === groupId);
  }

  static async createGroup(dto: GroupSaveDto): Promise<number> {
    if (!dto.name || !dto.curator) {
      throw new Error("Потрібно вказати 'name' та 'curator'");
    }
    const existing = await GroupDao.findGroupByName(dto.name);
    if (existing) {
      throw new Error("Група з таким ім'ям вже існує в БД");
    }
    const newGroupId = await GroupDao.createGroup(dto);
    return newGroupId;
  }

  static async updateGroup(
    id: number,
    name: string,
    curator: string
  ): Promise<any> {
    if (!name || !curator) {
      throw new Error("Потрібно вказати 'name' та 'curator'");
    }
    const existedGroup = await GroupDao.findGroupByName(name);
    if (existedGroup && existedGroup.id !== id) {
      throw new Error("Група з таким ім'ям вже існує");
    }
    const updatedRow = await GroupDao.updateGroup(id, name, curator);
    if (!updatedRow) {
      throw new Error("Групу не знайдено за вказаним id");
    }
    return updatedRow;
  }

  static async deleteGroup(id: number): Promise<void> {
    const deletedCount = await GroupDao.deleteGroup(id);

    if (!deletedCount) {
      throw new Error("Групу не знайдено за вказаним id");
    }
  }

}