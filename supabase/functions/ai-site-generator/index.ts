// Edge function: gerador de páginas de site por IA
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é um designer de landing pages. Gere a estrutura de blocos para uma landing page em português brasileiro.
RETORNE APENAS JSON VÁLIDO no formato:
{
  "title": "Título da página",
  "blocks": [
    { "type": "hero", "props": { "title": "...", "subtitle": "...", "cta_label": "...", "cta_link": "#contato", "bg_gradient": "linear-gradient(135deg,#3B6D11,#0a0a0a)", "align": "center" } },
    { "type": "features", "props": { "title": "...", "items": [{ "icon": "Zap", "title": "...", "text": "..." }] } },
    { "type": "testimonials", "props": { "title": "...", "items": [{ "name": "...", "role": "...", "text": "..." }] } },
    { "type": "pricing", "props": { "title": "...", "plans": [{ "name": "...", "price": "R$ ...", "features": ["..."], "cta": "...", "highlight": false }] } },
    { "type": "faq", "props": { "title": "...", "items": [{ "q": "...", "a": "..." }] } },
    { "type": "footer", "props": { "text": "© 2026 ..." } }
  ]
}
Tipos válidos: hero, text, image, button, features, gallery, testimonials, faq, pricing, video, vsl, social, countdown, form_embed, footer.
Ícones válidos (lucide): Zap, Shield, Heart, Sparkles, Star, Rocket, Target, TrendingUp, Award, CheckCircle.
NÃO inclua markdown, NÃO use \`\`\`json, retorne só o objeto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { brief } = await req.json();
    if (!brief || typeof brief !== "string") {
      return new Response(JSON.stringify({ error: "brief required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Briefing: ${brief}` },
        ],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Limite atingido. Aguarde alguns minutos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos AI esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI error: ${t}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    let raw: string = data?.choices?.[0]?.message?.content ?? "";
    raw = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      parsed = JSON.parse(match[0]);
    }

    if (!parsed?.blocks || !Array.isArray(parsed.blocks)) {
      return new Response(JSON.stringify({ error: "Missing blocks in AI output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
