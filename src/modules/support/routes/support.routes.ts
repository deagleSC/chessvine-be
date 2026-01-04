import { Router } from "express";
import { createContactTicket } from "../controllers/support.controller";
import { validate } from "../../../shared/middleware/validate";
import { contactTicketSchema } from "../validators/support.validator";

const router = Router();

// Public route - anyone can submit a contact ticket
router.post("/contact", validate(contactTicketSchema), createContactTicket);

export default router;
