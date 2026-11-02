create or replace function public.update_own_staff_profile(new_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_full_name is null or btrim(new_full_name) = '' then
    raise exception 'Full name is required';
  end if;

  update public.staff
  set full_name = btrim(new_full_name)
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_staff_profile(text) to authenticated;

drop policy if exists "staff_update_admin_only" on public.staff;

create policy "staff_update_self_or_admin" on public.staff
  for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());
