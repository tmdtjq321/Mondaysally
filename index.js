const express = require('./config/express');
const { logger, errLogger, logmessage } = require('./config/winston');

const port = 3000;
express().listen(port);
logger.info({message : `API Server Start At Port ${port}`});