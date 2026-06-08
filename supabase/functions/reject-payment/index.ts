import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Morshop <morshop.vercel.app@gmail.com>',
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { payment_request_id, user_email, store_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: prError } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', payment_request_id);
    if (prError) throw prError;

    // Enviar email (no bloquea el rechazo si falla)
    try {
      await sendEmail({
        to: user_email,
        subject: 'Sobre tu pago — Morshop Plus',
        html: `
          <h2>Hola, ${store_name}</h2>
          <p>No pudimos confirmar tu pago de $18.900.</p>
          <p>Si creés que es un error, respondé este mail con el comprobante y lo revisamos.</p>
          <br>
          <p>— El equipo de Morshop</p>
        `,
      });
    } catch (emailErr) {
      console.error('Email failed (non-fatal):', emailErr);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    });
  }
});
