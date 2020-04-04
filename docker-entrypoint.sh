#!/bin/bash
set -e

### Start app

pm2 start ts-node -n bot -i max --log-date-format 'YYYY-MM-DD HH:mm:ss.SSS' -- -r tsconfig-paths/register index.ts

pm2 log

exec "$@"
