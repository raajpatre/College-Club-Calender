import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json().catch(() => ({}));

  // ── Soft-delete (deactivate) flow ──────────────────────────────
  if (body.deactivateClubId) {
    const { data: club } = await adminClient
      .from('clubs')
      .select('name, president_id')
      .eq('id', body.deactivateClubId)
      .single();

    const { error } = await adminClient
      .from('clubs')
      .update({ is_active: false })
      .eq('id', body.deactivateClubId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      action_type: 'DEACTIVATE_PRESIDENT',
      target_club: club?.name || 'Unknown',
      description: `Club "${club?.name}" was deactivated by admin.`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── Create president flow ──────────────────────────────────────
  const { username, password, clubName, category, email, tech_tag } = body;

  if (!username || !password || !clubName || !category || !tech_tag) {
    return new Response(JSON.stringify({ error: 'Missing required fields: username, password, clubName, category, tech_tag' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cleanUsername = username.toLowerCase().trim();
  const internalEmail = `${cleanUsername}@nstcal.internal`;

  const { data: existing } = await adminClient
    .from('clubs')
    .select('id')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: `Username "${username}" is already taken. Choose a different one.` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true,
  });

  if (createErr) {
    return new Response(JSON.stringify({ error: `Auth error: ${createErr.message}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { error: clubErr } = await adminClient.from('clubs').insert({
    president_id: newUser.user.id,
    name: clubName.trim(),
    category,
    username: cleanUsername,
    email: email?.trim() || null,
    tech_tag
  });

  if (clubErr) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return new Response(JSON.stringify({ error: `Club insert error: ${clubErr.message}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Audit log
  await adminClient.from('audit_logs').insert({
    action_type: 'CREATE_PRESIDENT',
    target_club: clubName.trim(),
    description: `President account created for "${clubName.trim()}" (${tech_tag}, username: ${cleanUsername}).`,
  });

  return new Response(
    JSON.stringify({ success: true, userId: newUser.user.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
