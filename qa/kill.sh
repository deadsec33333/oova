#!/bin/bash
# kill node processes by script name
for p in $(pgrep -f "node $1"); do kill $p; done
