#!/bin/bash
echo "Launching broker"
while ! nc -z rabbit 5672; do sleep 3; done && node bin/broker.js

