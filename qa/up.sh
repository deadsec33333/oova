#!/bin/bash
# start all local stand ins (fresh state)
cd /home/claude/harness
for s in stubs.mjs moonpay-stub.mjs coinflow-stub.mjs; do nohup node $s > /tmp/$s.log 2>&1 & done
sleep 1
