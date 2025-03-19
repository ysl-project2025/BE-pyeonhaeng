const express = require('express')
const router = express.Router();
import { productAllView, productBookmarkAdd, productBookmarkDelete, productFindName, productFindNew, productFindReview, productFindScore, productFindView, productView } from "../controllers/productController";
import { ensureAuthorization, validate } from "../middlewares/middlewares";

router.use(express.json());

router.get('/', ensureAuthorization, productAllView); // 상품 목록 전체 조회 API

router.get('/:product_id', ensureAuthorization, productView) // 상품 개별 조회 API

router.get('/add/:product_id', ensureAuthorization, productBookmarkAdd) // 상품 즐겨찾기 등록

router.get('/delete/:product_id', ensureAuthorization, productBookmarkDelete) // 상품 즐겨찾기 삭제

router.get('/find/view_count', ensureAuthorization, productFindView) // 상품 조회수 정렬

router.get('/find/new', ensureAuthorization, productFindNew) // 상품 신상 정렬

router.get('/find/score', ensureAuthorization, productFindScore) // 상품 유저 평점 순 정렬

router.get('/find/review', ensureAuthorization, productFindReview) // 상품 리뷰순 정렬

router.get('/find/:product_name', ensureAuthorization, productFindName) // 상품 이름으로 찾기 API


module.exports = router;