// supabase/functions/send-otp/index.ts
// Generates a 6-digit OTP, stores it in the `otp_codes` table (TTL 10 min),
// and sends it via Telnyx SMS.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TELNYX_API_KEY  = Deno.env.get("TELNYX_API_KEY")!
const TELNYX_PHONE    = Deno.env.get("TELNYX_PHONE_NUMBER")!
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { phone } = await req.json()
    if (!phone) return json({ success: false, message: "Phone number is required." }, 400)

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store OTP in Supabase
    const sb = createClient(SUPABASE_URL, SUPABASE_SECRET)
    await sb.from("otp_codes").upsert(
      { phone, code, expires_at: expiresAt, verified: false },
      { onConflict: "phone" }
    )

    // Send SMS via Telnyx
    const smsRes = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: TELNYX_PHONE,
        to:   phone,
        text: `Your Shoora EB-5 verification code is: ${code}. Valid for 10 minutes.`,
      }),
    })

    if (!smsRes.ok) {
      const err = await smsRes.text()
      console.error("[send-otp] Telnyx error:", err)
      return json({ success: false, message: "Failed to send SMS. Please try again." }, 502)
    }

    return json({ success: true, message: "SMS verification code sent." })
  } catch (e) {
    console.error("[send-otp] unexpected error:", e)
    return json({ success: false, message: "Internal server error." }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
