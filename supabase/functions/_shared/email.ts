export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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
