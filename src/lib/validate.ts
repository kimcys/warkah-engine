// Checks an event.json (a draft from the builder) against the schema and explains each problem in Malay, naming the field.
// Pure TypeScript with no Astro imports, so the builder's API Worker can import it as well as the build.
import { eventSchema } from "./event-schema";
import { labelFor } from "./builder-steps";

export interface Problem {
  path: string;      // "couple.groom.name"
  field: string;     // Malay label (falls back to the path)
  message: string;   // Malay, ready to show
}

export function validateEvent(data: unknown): { ok: true } | { ok: false; problems: Problem[] } {
  const result = eventSchema.safeParse(data);
  if (result.success) return { ok: true };
  const problems = result.error.issues.map((issue): Problem => {
    const path = issue.path.join(".");
    const field = labelFor(path) ?? path;
    let message: string = issue.message;
    switch (issue.code) {
      case "invalid_type":
        message = String(issue.message).includes("received undefined") ? `Sila isi ${field}.` : `${field} tidak betul.`; break;
      case "too_small":
        message = issue.origin === "array" ? `Sila tambah sekurang-kurangnya ${issue.minimum} untuk ${field}.` : issue.origin === "string" ? `${field} terlalu pendek.` : `${field} terlalu kecil (minimum ${issue.minimum}).`; break;
      case "too_big":
        message = issue.origin === "array" ? `${field} terlalu banyak (maksimum ${issue.maximum}).` : `${field} terlalu besar (maksimum ${issue.maximum}).`; break;
      case "invalid_format":
        message = issue.format === "url" ? `${field} mesti pautan penuh bermula dengan https://` : issue.format === "datetime" ? `${field} mesti tarikh dan masa yang sah.` : `Format ${field} tidak betul.`; break;
      case "invalid_value":
        message = `Pilihan ${field} tidak sah. Pilih salah satu: ${issue.values.join(", ")}.`; break;
    }
    return { path, field, message };
  });
  return { ok: false, problems };
}
