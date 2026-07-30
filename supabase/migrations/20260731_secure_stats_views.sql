-- Close an RLS bypass in the dashboard stats views.
--
-- Postgres views run with the privileges of their OWNER by default, so
-- page_view_stats / chant_view_stats / chant_save_stats returned aggregated
-- rows to anyone holding the public anon key, even though row level security
-- on the underlying tables correctly blocked reading those tables directly.
--
-- security_invoker = true (Postgres 15+) makes the views run as the querying
-- user instead, so the existing RLS policies apply: admins see everything,
-- everyone else sees nothing.
--
-- Also adds an admin read policy on saved_chants. Without it, security_invoker
-- would limit chant_save_stats to the admin's own saves and the dashboard's
-- "Most Saved Chants" card would under-report.

do $$
begin
  begin
    drop policy if exists "Admins can read all saved chants" on public.saved_chants;
    create policy "Admins can read all saved chants"
      on public.saved_chants
      for select
      using (public.is_current_user_admin());
  exception when others then
    raise notice 'SKIPPED saved_chants admin read policy: %', sqlerrm;
  end;

  begin
    execute 'alter view public.page_view_stats set (security_invoker = true)';
  exception when others then
    raise notice 'SKIPPED page_view_stats security_invoker: %', sqlerrm;
  end;

  begin
    execute 'alter view public.chant_view_stats set (security_invoker = true)';
  exception when others then
    raise notice 'SKIPPED chant_view_stats security_invoker: %', sqlerrm;
  end;

  begin
    execute 'alter view public.chant_save_stats set (security_invoker = true)';
  exception when others then
    raise notice 'SKIPPED chant_save_stats security_invoker: %', sqlerrm;
  end;
end
$$;

notify pgrst, 'reload schema';

-- Confirm: security_invoker should read "true" for all three.
select
  c.relname as view_name,
  coalesce(
    (select o from unnest(c.reloptions) o where o like 'security_invoker%'),
    'security_invoker=NOT SET'
  ) as setting
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('page_view_stats', 'chant_view_stats', 'chant_save_stats')
order by c.relname;
