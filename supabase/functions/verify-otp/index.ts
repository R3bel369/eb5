// supabase/functions/verify-otp/index.ts
// Verifies the 6-digit OTP against the stored value in `otp_codes`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { phone, code } = await req.json()
    if (!phone || !code) return json({ success: false, message: "Phone and code are required." }, 400)

    const sb = createClient(SUPABASE_URL, SUPABASE_SECRET)
    const { data, error } = await sb
      .from("otp_codes")
      .select("code, expires_at, verified")
      .eq("phone", phone)
      .single()

    if (error || !data) {
      return json({ success: false, verified: false, message: "No OTP found. Please request a new code." })
    }

    if (data.verified) {
      return json({ success: true, verified: true })
    }

    if (new Date(data.expires_at) < new Date()) {
      return json({ success: false, verified: false, message: "OTP has expired. Please request a new code." })
    }

    if (data.code !== String(code).trim()) {
      return json({ success: false, verified: false, message: "Incorrect code. Please check your SMS and try again." })
    }

    // Mark as verified
    await sb.from("otp_codes").update({ verified: true }).eq("phone", phone)

    return json({ success: true, verified: true })
  } catch (e) {
    console.error("[verify-otp] unexpected error:", e)
    return json({ success: false, verified: false, message: "Internal server error." }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
