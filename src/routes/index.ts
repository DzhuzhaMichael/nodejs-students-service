import { Router } from "express";
import groupRoutes from "./group.routes";
import studentRoutes from "./student.routes";

const router = Router();

router.use("/student", studentRoutes);
router.use("/group", groupRoutes);

export default router;
