const express = require('express')
const router = express.Router();
import { login, logout, memberInfo, memberModify, memberWithdraw, register } from "../controllers/authController";
const { check } = require('express-validator');
import { ensureAuthorization, validate } from "../middlewares/middlewares";

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

// 회원 정보 조회 API
router.get('/', ensureAuthorization, memberInfo);

// 회원 정보 수정 API
router.put('/modify', ensureAuthorization, [
    check('user_name').notEmpty().isString().withMessage('문자열 입력 필요'),
    validate
], memberModify);

// 회원 탈퇴 API
router.delete('/withdraw', ensureAuthorization, [
    check('user_password').notEmpty().isString().withMessage('문자열 입력 필요'),
    validate
], memberWithdraw)

router.post('/logout', logout);
module.exports = router;