alter table rooms rename to leagues;
alter table room_members rename to league_members;
alter table league_members rename column room_id to league_id;
