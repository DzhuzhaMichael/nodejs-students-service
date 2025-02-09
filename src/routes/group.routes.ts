import { Router } from "express";
import { GroupController } from "../controllers/group.controller";

const router = Router();

router.get("/", GroupController.listGroups);
router.post("/", GroupController.createGroup);
router.put("/:id", GroupController.updateGroup);
router.delete("/:id", GroupController.deleteGroup);

export default router;
