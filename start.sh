#!/bin/bash
forever start -a -l "/home/ubuntu/game/log/forever_log.log" -w --watchIgnore --sourceDir "/home/ubuntu/game/" index.js
