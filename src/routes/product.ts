const express = require('express')
const router = express.Router();
import { productAllView, productBookmarkAdd, productBookmarkDelete, productView } from "../controllers/productController";
import { ensureAuthorization, validate } from "../middlewares/middlewares";

router.use(express.json());

router.get('/', ensureAuthorization, productAllView); // 상품 목록 전체 조회 API

router.get('/:product_id', ensureAuthorization, productView) // 상품 개별 조회 API

router.get('/add/:product_id', ensureAuthorization, productBookmarkAdd) // 상품 즐겨찾기 등록

router.get('/delete/:product_id', ensureAuthorization, productBookmarkDelete) // 상품 즐겨찾기 삭제

module.exports = router;