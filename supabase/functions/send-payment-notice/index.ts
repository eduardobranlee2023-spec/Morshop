import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email.ts';

serve(async (req) => {
  // CORS configuration
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { email, store_name } = await req.json();

    await sendEmail({
      to: email,
      subject: 'Recibimos tu aviso de pago — Morshop Plus',
      html: `
        <h2>¡Hola, ${store_name}!</h2>
        <p>Recibimos tu aviso de pago de <strong>$18.900</strong> para el Plan Plus de Morshop.</p>
        <p>Estamos revisando el pago. En las próximas horas activaremos tu plan y te avisaremos por este correo.</p>
        <p>¿Dudas? Respondé este mail.</p>
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
