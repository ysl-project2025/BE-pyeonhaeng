import { Request, Response } from 'express';
const conn = require('../db');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()