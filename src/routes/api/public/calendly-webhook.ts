import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Calendly webhook receiver.
// Configure no Calendly: https://calendly.com/integrations/api_webhooks
// URL de assinatura: https://SEU-DOMINIO/api/public/calendly-webhook?u=USER_ID
// Eventos: invitee.created, invitee.canceled
//
// O parâmetro ?u=USER_ID identifica a qual usuário do app o agendamento pertence.

export const Route = createFileRoute("/api/public/calendly-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const userId = url.searchParams.get("u");
          if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
            return new Response("Missing or invalid ?u= user_id", { status: 400 });
          }

          const body = await request.json().catch(() => null);
          if (!body || typeof body !== "object") {
            return new Response("Invalid JSON", { status: 400 });
          }

          const event: string = body.event || "";
          const payload: any = body.payload || {};
          const invitee = payload; // Calendly v2 puts invitee fields on payload
          const email: string | null = invitee.email || null;
          const name: string | null = invitee.name || null;
          const scheduled = invitee.scheduled_event || {};
          const startTime: string | null = scheduled.start_time || null;
          const meetUrl: string | null = scheduled?.location?.join_url || scheduled?.location?.location || null;

          // Try to extract phone from custom Q&A
          let phone: string | null = null;
          const qa: any[] = Array.isArray(invitee.questions_and_answers) ? invitee.questions_and_answers : [];
          for (const item of qa) {
            const q = String(item?.question || "").toLowerCase();
            if (q.includes("whats") || q.includes("phone") || q.includes("telefone") || q.includes("celular")) {
              phone = String(item?.answer || "") || null;
              break;
            }
          }

          if (event === "invitee.canceled") {
            if (email) {
              await supabaseAdmin
                .from("leads")
                .update({ scheduled_at: null })
                .eq("user_id", userId)
                .eq("email", email);
            }
            return Response.json({ ok: true, action: "canceled" });
          }

          // invitee.created (or default)
          if (!startTime) return new Response("Missing start_time", { status: 400 });
          const scheduled_at = new Date(startTime).toISOString();

          // Find existing lead by email; if not, create one.
          let leadId: string | null = null;
          if (email) {
            const { data: existing } = await supabaseAdmin
              .from("leads")
              .select("id")
              .eq("user_id", userId)
              .eq("email", email)
              .limit(1)
              .maybeSingle();
            if (existing?.id) leadId = existing.id;
          }

          if (leadId) {
            await supabaseAdmin
              .from("leads")
              .update({
                scheduled_at,
                ...(name ? { nome: name } : {}),
                ...(phone ? { whatsapp: phone } : {}),
                custom_data: { calendly: { event_uri: scheduled.uri || null, meet_url: meetUrl } },
              })
              .eq("id", leadId);
          } else {
            await supabaseAdmin.from("leads").insert({
              user_id: userId,
              nome: name,
              email,
              whatsapp: phone,
              status: "Qualificado",
              pipeline: "Agendamento",
              scheduled_at,
              custom_data: { calendly: { event_uri: scheduled.uri || null, meet_url: meetUrl } },
            });
          }

          return Response.json({ ok: true, action: "scheduled" });
        } catch (err: any) {
          console.error("calendly-webhook error", err);
          return new Response("Internal error", { status: 500 });
        }
      },
      GET: async () => new Response("Calendly webhook OK", { status: 200 }),
    },
  },
});
