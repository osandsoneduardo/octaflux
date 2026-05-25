/**
 * AI-First Engine Schemas
 * Define estruturas para geração automática de funis, leads e automações
 */

export interface AIFunnelRequest {
  businessType: string;
  targetAudience: string;
  mainGoal: string;
  productOrService: string;
  budget?: string;
  tone?: "professional" | "casual" | "premium";
}

export interface AIGeneratedFunnel {
  id: string;
  name: string;
  description: string;
  type: "vsl" | "quiz" | "webinar" | "application" | "booking";
  landingPage: {
    headline: string;
    subheadline: string;
    cta: string;
    heroImage?: string;
  };
  form: {
    title: string;
    fields: FormField[];
    successMessage: string;
  };
  automation: {
    triggers: AutomationTrigger[];
    actions: AutomationAction[];
  };
  crm: {
    pipelineName: string;
    stages: string[];
  };
}

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "select" | "textarea" | "checkbox" | "rating";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  conditional?: {
    field: string;
    value: string;
  };
}

export interface AutomationTrigger {
  id: string;
  type: "form_submit" | "lead_score" | "tag_added" | "time_delay";
  condition?: string;
}

export interface AutomationAction {
  id: string;
  type: "send_email" | "send_whatsapp" | "add_tag" | "update_score" | "webhook" | "delay";
  config: Record<string, any>;
}

export interface LeadScoringModel {
  id: string;
  name: string;
  criteria: ScoringCriteria[];
  weights: Record<string, number>;
}

export interface ScoringCriteria {
  id: string;
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in_range";
  value: any;
  points: number;
}

export interface AILeadScore {
  leadId: string;
  totalScore: number;
  temperature: "cold" | "warm" | "hot";
  breakdown: Record<string, number>;
  recommendation: string;
}

export interface AIGeneratedCopy {
  headline: string;
  subheadline: string;
  bodyText: string;
  cta: string;
  whatsappSequence: string[];
  emailSequence: string[];
}

export interface AIPageGeneration {
  type: "landing" | "sales" | "thank_you" | "webinar";
  blocks: PageBlock[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export interface PageBlock {
  id: string;
  type: "hero" | "benefits" | "testimonials" | "pricing" | "faq" | "form" | "countdown" | "video";
  content: Record<string, any>;
  styling: Record<string, any>;
}

export interface AIWebinarConfig {
  title: string;
  description: string;
  duration: number;
  speakerName: string;
  speakerBio: string;
  mainTopic: string;
  keyPoints: string[];
  cta: string;
  fakeComments: FakeComment[];
  countdownMinutes: number;
}

export interface FakeComment {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  avatar?: string;
}

export interface WhiteLabelConfig {
  workspaceId: string;
  customDomain?: string;
  brandName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  customCSS?: string;
  faviconUrl?: string;
  removeOctafluxBranding: boolean;
}

export interface MultiTenantOrganization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: "free" | "pro" | "enterprise";
  members: OrganizationMember[];
  settings: WhiteLabelConfig;
  createdAt: Date;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  email: string;
  joinedAt: Date;
}
