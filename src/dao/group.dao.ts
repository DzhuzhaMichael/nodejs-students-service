import knex from "knex";
import config from "../database/knexfile";
import { GroupSaveDto } from "../dto/groupSaveDto";

const db = knex(config.development);

export class GroupDao {
  
  static async listGroups() {
    return db("groups").select("*");
  }

  static async createGroup(dto: GroupSaveDto): Promise<number> {
    const [newGroupId] = await db("groups")
      .insert({ name: dto.name, curator: dto.curator })
      .returning("id");
    return newGroupId;
  }

  static async findGroupByName(name: string) {
    return db("groups").where({ name }).first();
  }

  static async updateGroup(
    id: number,
    name: string,
    curator: string
  ): Promise<any | null> {
    const [updatedRow] = await db("groups")
      .where({ id })
      .update({ name, curator })
      .returning(["id", "name", "curator"]);
    return updatedRow || null;
  }

  static async deleteGroup(id: number): Promise<number> {
    const deletedCount = await db("groups").where({ id }).del();
    return deletedCount;
  }
  
  static async getTopGroups(n: number): Promise<any[]> {
    const results = await db("groups as g")
      .select("g.id", "g.name")
      .count("s.id as count")
      .leftJoin("students as s", "s.group_id", "=", "g.id")
      .groupBy("g.id")
      .orderBy("count", "desc")
      .limit(n);
    return results;
  }
  
}