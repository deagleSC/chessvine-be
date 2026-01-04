export interface IContactTicket {
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  created_at?: Date;
  updated_at?: Date;
}

export interface ContactTicketRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactTicketResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
