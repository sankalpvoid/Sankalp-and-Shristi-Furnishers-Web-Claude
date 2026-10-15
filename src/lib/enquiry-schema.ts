import { z } from "zod";

const phone = z.string().trim().min(7, "Enter a phone number we can reach you on").max(20).regex(/^[0-9+()\-\s]+$/, "Phone numbers can only contain digits, spaces, + ( ) -");
export const enquirySchema = z.object({
  type: z.enum(["general", "product", "configuration", "quote", "visit", "order_intent"]),
  intent: z.enum(["exploring", "quote", "visit", "order"]).default("quote"),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone,
  email: z.string().trim().max(120).email("That email address doesn't look right").optional().or(z.literal("")),
  contactMethod: z.enum(["phone", "whatsapp", "email"]).default("phone"),
  productId: z.number().int().positive().optional(),
  configRef: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").optional().or(z.literal("")),
  categories: z.array(z.string().max(60)).max(15).default([]),
  shortlist: z.array(z.string().max(120)).max(30).default([]),
  website: z.string().max(0).optional(), // honeypot
});
export type EnquiryInput = z.infer<typeof enquirySchema>;
