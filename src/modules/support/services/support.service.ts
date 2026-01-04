import { ContactTicket } from "../models/contact-ticket.model";
import {
  ContactTicketRequest,
  ContactTicketResponse,
  IContactTicket,
} from "../types";
import { logger } from "../../../shared/utils/logger";

class SupportService {
  async createContactTicket(
    data: ContactTicketRequest,
  ): Promise<ContactTicketResponse> {
    try {
      const ticket = await ContactTicket.create({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: "open",
      });

      logger.info(`Contact ticket created: ${ticket._id} from ${data.email}`);

      return {
        id: ticket._id.toString(),
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status || "open",
        created_at: ticket.created_at || new Date(),
        updated_at: ticket.updated_at || new Date(),
      };
    } catch (error) {
      logger.error("Error creating contact ticket:", error);
      throw new Error("Failed to create contact ticket");
    }
  }

  async getContactTicketById(
    id: string,
  ): Promise<ContactTicketResponse | null> {
    try {
      const ticket = await ContactTicket.findById(id);
      if (!ticket) {
        return null;
      }

      return {
        id: ticket._id.toString(),
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status || "open",
        created_at: ticket.created_at || new Date(),
        updated_at: ticket.updated_at || new Date(),
      };
    } catch (error) {
      logger.error("Error fetching contact ticket:", error);
      throw new Error("Failed to fetch contact ticket");
    }
  }

  async getContactTicketsByEmail(
    email: string,
  ): Promise<ContactTicketResponse[]> {
    try {
      const tickets = await ContactTicket.find({ email })
        .sort({ created_at: -1 })
        .exec();

      return tickets.map((ticket) => ({
        id: ticket._id.toString(),
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status || "open",
        created_at: ticket.created_at || new Date(),
        updated_at: ticket.updated_at || new Date(),
      }));
    } catch (error) {
      logger.error("Error fetching contact tickets by email:", error);
      throw new Error("Failed to fetch contact tickets");
    }
  }
}

export const supportService = new SupportService();
