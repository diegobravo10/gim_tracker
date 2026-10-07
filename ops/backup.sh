#!/bin/sh
set -eu

backup_dir=/backups
mkdir -p "$backup_dir"

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  destination="$backup_dir/gym-$timestamp.dump"

  if pg_dump --format=custom --no-owner --no-acl \
    --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
    --dbname="$PGDATABASE" --file="$destination"; then
    touch "$backup_dir/.last-success"
    find "$backup_dir" -type f -name 'gym-*.dump' -mtime +13 -delete
    echo "Backup completed: $destination"
  else
    rm -f "$destination"
    echo "Backup failed" >&2
  fi

  sleep 86400
done

