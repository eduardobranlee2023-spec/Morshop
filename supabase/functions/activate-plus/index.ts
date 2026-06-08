import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';

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
    await supabase
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', payment_request_id);

    // Activar plan en stores
    await supabase
      .from('stores')
      .update({
        plan: 'plus',
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', store_id);

    // Enviar email de confirmación
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
