-- Services are a shared catalog offered at every clinic location.
do $$
begin
  if to_regclass('public.services') is not null then
    execute 'update public.services set location_id = null where location_id is not null';
    execute 'alter table public.services drop column if exists location_id';
  end if;
end;
$$;