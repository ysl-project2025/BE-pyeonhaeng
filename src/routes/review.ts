const express = require('express')
const router = express.Router();
const { check } = require('express-validator');
import { ensureAuthorization, validate } from "../middlewares/middlewares";

router.use(express.json());

router.get('/', ensureAuthorization); // 상품 리뷰 전체 조회 API

router.post('/write', ensureAuthorization); // 상품 리뷰 작성 API

router.delete('/delete/:review_id', ensureAuthorization) // 상품 리뷰 삭제 API

router.get('/like', ensureAuthorization) // 상품 리뷰 좋아요 추가 API

router.get('/dislike', ensureAuthorization) // 상품 리뷰 싫어요 추가 API

router.put('/modify/:review_id', ensureAuthorization) // 상품 리뷰 수정 API

module.exports = router;