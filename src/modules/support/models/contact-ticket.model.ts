import mongoose, { Document, Schema } from "mongoose";
import { IContactTicket } from "../types";

export interface IContactTicketDocument extends IContactTicket, Document {}

const ContactTicketSchema = new Schema<IContactTicketDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// Index for efficient queries
ContactTicketSchema.index({ email: 1, created_at: -1 });
ContactTicketSchema.index({ status: 1, created_at: -1 });

export const ContactTicket = mongoose.model<IContactTicketDocument>(
  "ContactTicket",
  ContactTicketSchema,
);
