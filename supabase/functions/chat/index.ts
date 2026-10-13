// Supabase Edge Function: chat
// Handles AI chatbot requests with OpenAI (or configurable provider)
// Deploy with: supabase functions deploy chat

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { message, history, systemPrompt, collectedData } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey   = Deno.env.get('AI_PROVIDER_API_KEY')
    const model    = Deno.env.get('AI_MODEL') || 'gpt-4o'
    const provider = Deno.env.get('AI_PROVIDER') || 'openai'

    if (!apiKey) {
      return new Response(JSON.stringify({
        message: 'The AI assistant is not yet configured. Please set AI_PROVIDER_API_KEY in the server environment. In the meantime, I can direct you to official USCIS resources at uscis.gov for EB-5 information.',
        sources: ['https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program'],
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // Build OpenAI-compatible messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10), // Keep last 10 exchanges for context
      { role: 'user', content: message },
    ]

    let aiResponse: string
    let sources: string[] = []

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens:  1000,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('OpenAI API error:', err)
        throw new Error('AI provider error')
      }

      const data = await response.json()
      aiResponse = data.choices?.[0]?.message?.content || 'I was unable to generate a response.'

    } else if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages
              .filter(m => m.role !== 'system')
              .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
              })),
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      )
      const data = await response.json()
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I was unable to generate a response.'

    } else {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }

    // Detect if response mentions USCIS topics → add source
    if (/uscis|I-526|I-829|eb-5|visa bulletin/i.test(aiResponse)) {
      sources = ['https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program']
    }

    return new Response(JSON.stringify({ message: aiResponse, sources }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Chat function error:', err)
    return new Response(JSON.stringify({
      message: 'I encountered a temporary issue. Please try again in a moment.',
    }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
