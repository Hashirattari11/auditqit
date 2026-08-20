# AuditIQ — Deployment Guide

## Vercel Setup
1. Connect GitHub repo to Vercel
2. Add all environment variables (see .env)
3. Set Node.js version to 20 in project settings
4. vercel.json already configured with 60s function timeout

### Environment Variables for Production
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ... (service_role key)
LLM_API_KEY=nvapi-...
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1
NEXT_PUBLIC_APP_URL=https://auditiq.com
NEXTAUTH_SECRET=<generate random 64 char string>
NEXTAUTH_URL=https://auditiq.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
RESEND_API_KEY=re_...
FROM_EMAIL=reports@auditiq.com
```

## Post-Deploy Checks
- [ ] Test URL audit end-to-end
- [ ] Test GitHub audit end-to-end
- [ ] Test user signup and login
- [ ] Test Stripe checkout (test mode first)
- [ ] Test PDF download
- [ ] Test email delivery
- [ ] Check all environment variables set
- [ ] Enable Stripe webhook in dashboard
- [ ] Set Stripe to live mode
- [ ] Test anonymous usage limits
- [ ] Verify AI summaries working with Nemotron

## Stripe Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://auditiq.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET

## Monitoring
- Vercel Analytics: Built-in with @vercel/analytics
- Error tracking: Console errors with structured logging
- AI: NVIDIA Nemotron (free tier, no cost)

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js v5 (Credentials + JWT)
- **AI**: NVIDIA Nemotron 49B (free)
- **Payments**: Stripe
- **Email**: Resend
- **Audit Engine**: Lighthouse, Playwright, custom analyzers
