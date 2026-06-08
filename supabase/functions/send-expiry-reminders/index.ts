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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: stores } = await supabase
      .from('stores')
      .select('id, user_id, name, whatsapp_number, plan_expires_at, last_reminder_sent_at')
      .eq('plan', 'plus')
      .lte('plan_expires_at', in3Days.toISOString())
      .gte('plan_expires_at', now.toISOString())
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lte.${yesterday.toISOString()}`);

    let count = 0;
    for (const store of stores || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(store.user_id);
      if (!authUser?.user?.email) continue;

      const expiresDate = new Date(store.plan_expires_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      await sendEmail({
        to: authUser.user.email,
        subject: `Tu Plan Plus vence pronto — Morshop`,
        html: `
          <h2>Hola, ${store.name}</h2>
          <p>Tu Plan Plus de Morshop vence el <strong>${expiresDate}</strong>.</p>
          <p>Mercado Pago intentará renovar tu suscripción automáticamente. Si tenés algún problema con el pago, entrá a tu panel y avisanos.</p>
          <br>
          <p>— El equipo de Morshop</p>
        `,
      });

      await supabase.from('stores').update({ last_reminder_sent_at: now.toISOString() }).eq('id', store.id);
      count++;
    }

    return new Response(JSON.stringify({ ok: true, sent: count }), {
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
