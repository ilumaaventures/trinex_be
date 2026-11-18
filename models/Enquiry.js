import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    message: { type: String, required: true },
    source: { type: String, default: "web-contact-form" },
    recipient: { type: String, default: "info@trinexsystems.in" },
    sender: { type: String, default: "info@trinexsystems.in" },
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

export const Enquiry =
  mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);
