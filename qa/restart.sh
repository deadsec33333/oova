#!/bin/bash
# restart the next server for a given dir
for p in $(pgrep -f "next-serv[e]r"); do kill $p; done
sleep 1
. /home/claude/harness/env.sh
cd "$1" && nohup npx next start -p 3000 > /tmp/srv.log 2>&1 &
sleep 5
