const express = require('express')
const router = express.Router();
import { login, register } from "../controllers/authController";
const { check } = require('express-validator');
import { validate } from "../middlewares/middlewares";

router.use(express.json());

// 로그인 API
router.post('/login', [
        check('user_id').notEmpty().isString().withMessage("문자열 입력 필요"),
        check('user_password').notEmpty().isString().withMessage('문자열 입력 필요'),
        validate
    ], login)

// 회원가입 API
router.post('/register', [
    check('user_id').notEmpty().isString().withMessage("문자열 입력 필요"),
        check('user_password').notEmpty().isString().withMessage('문자열 입력 필요'),
        check('user_name').notEmpty().isString().withMessage('문자열 입력 필요'),
    validate
], register)

module.exports = router;