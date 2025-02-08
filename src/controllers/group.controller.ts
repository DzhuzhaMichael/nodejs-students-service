import { Request, Response } from "express";
import knex from "knex";
import config from "../database/knexfile";

const db = knex(config.development);

export class GroupController {
  // Отримання списку усіх груп
  static async getAllGroups(req: Request, res: Response) {
    try {
      const groups = await db("groups").select("*");
      return res.status(200).json(groups);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка отримання списку груп" });
    }
  }

  // Створення групи (уникнення дублікатів з існуючими по параметру 'name')
  static async createGroup(req: Request, res: Response) {
    try {
      const { name, curator } = req.body;

      if (!name || !curator) {
        return res.status(400).json({ error: "Потрібно вказати 'name' та 'curator'" });
      }

      // Перевірка унікальності
      const existing = await db("groups").where({ name }).first();
      if (existing) {
        return res.status(400).json({ error: "Група з таким ім'ям вже існує в БД" });
      }

      const [newGroupId] = await db("groups")
        .insert({ name, curator })
        .returning("id");

      return res.status(201).json({ id: newGroupId, message: "Групу створено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при створенні групи" });
    }
  }

  // Оновлення групи (врахуючи унікальність)
  static async updateGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, curator } = req.body;

      if (!name || !curator) {
        return res.status(400).json({ error: "Потрібно вказати 'name' та 'curator'" });
      }

      // Перевірка унікальності за параметром 'name' (окрім поточного запису)
      const conflictGroup = await db("groups")
        .where("name", name)
        .whereNot("id", id)
        .first();
      if (conflictGroup) {
        return res.status(400).json({ error: "Група з таким ім'ям вже існує" });
      }

      const updated = await db("groups")
        .where({ id })
        .update({ name, curator });

      if (!updated) {
        return res.status(404).json({ error: "Групу не знайдено" });
      }

      return res.status(200).json({ message: "Групу оновлено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при оновленні групи" });
    }
  }

  // Видалення групи
  static async deleteGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await db("groups").where({ id }).del();

      if (!deleted) {
        return res.status(404).json({ error: "Групу не знайдено" });
      }

      return res.status(200).json({ message: "Групу видалено" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Виникла помилка при видаленні групи" });
    }
  }
}
