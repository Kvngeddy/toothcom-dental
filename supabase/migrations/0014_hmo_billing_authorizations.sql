alter table public.invoices
  add column if not exists hmo_treatment text,
  add column if not exists hmo_authorization_code text,
  add column if not exists hmo_authorized_at timestamptz,
  add column if not exists hmo_authorized_by uuid references public.staff(id);

alter table public.invoices
  drop constraint if exists invoices_hmo_authorization_fields_check,
  add constraint invoices_hmo_authorization_fields_check
    check (
      (hmo_treatment is null and hmo_authorization_code is null)
      or (nullif(btrim(hmo_treatment), '') is not null and nullif(btrim(hmo_authorization_code), '') is not null)
    );