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
    const { payment_request_id, store_id, user_email, store_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calcular fecha de vencimiento (30 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresFormatted = expiresAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Actualizar payment_request
    const { error: prError } = await supabase
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', payment_request_id);
    if (prError) throw prError;

    // Activar plan en stores
    const { error: storeError } = await supabase
      .from('stores')
      .update({
        plan: 'plus',
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', store_id);
    if (storeError) throw storeError;

    // Enviar email de confirmación (no bloquea la activación si falla)
    try {
      await sendEmail({
        to: user_email,
        subject: '¡Tu Plan Plus está activo! — Morshop',
        html: `
          <h2>¡Hola, ${store_name}!</h2>
          <p>✅ Confirmamos tu pago y tu <strong>Plan Plus ya está activo</strong>.</p>
          <p>Tu plan vence el: <strong>${expiresFormatted}</strong></p>
          <br>
          <p>A partir de ahora tenés acceso a:</p>
          <ul>
            <li>✅ Productos ilimitados</li>
            <li>✅ Paleta de colores completa</li>
            <li>✅ Tipografías premium</li>
            <li>✅ Redes sociales en tu tienda</li>
            <li>✅ Sin branding de Morshop</li>
            <li>✅ Estadísticas de tu tienda</li>
            <li>✅ Formulario de pedido avanzado</li>
          </ul>
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
