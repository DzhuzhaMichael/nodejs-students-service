import { Request, Response } from "express";
import knex from "knex";
import config from "../database/knexfile";
import { GroupService } from "../services/group.service";
import { GroupSaveDto } from "../dto/groupSaveDto";

const db = knex(config);

export class GroupController {
  
  static async listGroups(req: Request, res: Response) {
    try {
      const groupsDto = await GroupService.listGroups();
      return res.status(200).json(groupsDto);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Виникла помилка отримання списку груп"
      });
    }
  }

  static async createGroup(req: Request, res: Response) {
    try {
      const { name, curator } = req.body;
      const groupDto: GroupSaveDto = { name, curator };
      const newGroupId = await GroupService.createGroup(groupDto);
      return res.status(201).json({
        id: newGroupId,
        message: "Групу створено"
      });
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ error: error.message || "Виникла помилка при створенні групи" });
    }
  }

  static async updateGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, curator } = req.body;
      const updatedData = await GroupService.updateGroup(Number(id), name, curator);
      return res.status(200).json({
        message: "Інформацію про групу успішно оновлено",
        data: updatedData
      });
    } catch (error: any) {
      console.error(error);
      return res
        .status(400)
        .json({ error: error.message || "Виникла помилка при оновленні групи" });
    }
  }

  static async deleteGroup(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Невірний формат id" });
      }
      await GroupService.deleteGroup(Number(id));
      return res.status(200).json({ message: "Групу успішно видалено" });
    } catch (error: any) {
      console.error(error);
      if (error.message === "Групу не знайдено за вказаним id") {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Виникла помилка при видаленні групи" });
    }
  }

  static async getTopGroups(req: Request, res: Response) {
    try {
      const nParam = req.query.n as string;
      const n = nParam ? parseInt(nParam, 10) : 5;
      const topGroups = await GroupService.getTopGroups(n);
      return res.status(200).json(topGroups);
    } catch (error: any) {
      console.error(error);
      if (error.message.startsWith("Наразі доступно")) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Виникла помилка отримання top-груп" });
    }
  }
}
