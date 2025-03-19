const express = require('express')
const router = express.Router();
const { check } = require('express-validator');
import { addReview, addReviewDisLike, addReviewLike, deleteReview, modifyReview, reviewAllView } from "../controllers/reviewController";
import { ensureAuthorization, validate } from "../middlewares/middlewares";

router.use(express.json());

router.get('/:product_id',
    ensureAuthorization,
    check('product_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    reviewAllView); // 상품 리뷰 전체 조회 API

router.post('/write',
    ensureAuthorization,
    addReview
); // 상품 리뷰 작성 API

router.delete('/delete/:review_id/:product_id',
    ensureAuthorization,
    check('review_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    check('product_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    deleteReview
) // 상품 리뷰 삭제 API

router.get('/like/:review_id',
    ensureAuthorization,
    check('product_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    addReviewLike
) // 상품 리뷰 좋아요 추가 API

router.get('/dislike/:review_id',
    ensureAuthorization,
    check('product_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    addReviewDisLike
) // 상품 리뷰 싫어요 추가 API

router.put('/modify/:review_id',
    ensureAuthorization,
    check('review_id').notEmpty().isInt().withMessage('정수 입력 필요'),
    modifyReview
) // 상품 리뷰 수정 API

module.exports = router;