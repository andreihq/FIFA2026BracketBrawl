create table settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values ('deadline', '2026-06-14T23:59:59.000Z');
