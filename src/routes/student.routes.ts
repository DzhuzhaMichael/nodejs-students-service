import { Router } from "express";
import { StudentController } from "../controllers/student.controller";

const router = Router();

router.post("/", StudentController.createStudent);
router.get("/:id", StudentController.getStudentById);
router.put("/:id", StudentController.updateStudent);
router.delete("/:id", StudentController.deleteStudent);
router.post("/upload", StudentController.uploadStudents);

export default router;
