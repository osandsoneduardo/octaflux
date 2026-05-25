export function buildWhatsappUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template);
}

export type FormField = {
  id: string;
  user_id: string;
  label: string;
  field_key: string;
  field_type: "text" | "email" | "tel" | "number" | "select" | "qualification" | "textarea";
  placeholder: string | null;
  required: boolean;
  options: { label: string; qualified?: boolean }[];
  position: number;
  is_qualifier: boolean;
};

export function evaluateQualification(fields: FormField[], answers: Record<string, string>): { qualified: boolean; faixa: string } {
  const qf = fields.find((f) => f.is_qualifier);
  if (!qf) return { qualified: true, faixa: "" };
  const answer = answers[qf.field_key];
  const opt = (qf.options || []).find((o) => o.label === answer);
  return { qualified: !!opt?.qualified, faixa: answer || "" };
}
