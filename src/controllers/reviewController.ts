import { Request, Response } from 'express';
const conn = require('../db');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()

export const reviewAllView = (req: Request, res: Response) => { // 상품 리뷰 전체 조회 컨트롤러
    const { product_id } = req.params;
    try {
        let sql = `
            SELECT
                review_id,
                user_id,
                product_id,
                review_content,
                review_rating,
                review_like,
                review_dislike,
                created_at,
                update_at
            FROM
                reviews
            WHERE
                product_id = ?;
        `

        conn.query(sql, product_id, (err: any, results: any) => {
            if (err) {
                console.error("DB 조회 오류:", err);
                return res.status(500).json({ message: "서버 오류 발생" });
            }
            res.status(200).json({data: results})
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const addReview = (req: Request, res: Response) => { // 상품 리뷰 작성 컨트롤러
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id } = req.user;

    if (!user_id) {
        return res.status(401).json({ message: "해당 user_id가 없습니다." });
    }
    const { product_id, review_rating, review_content } = req.body;

    try {
        let sql = `
            INSERT INTO reviews (
                user_id,
                product_id,
                review_rating,
                review_content,
                review_like,
                review_dislike
            ) 
            VALUES (
                ?,
                ?,
                ?,
                ?,
                0,
                0
            );
        `
        const values = [user_id, product_id, review_rating, review_content]

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.error("DB 조회 오류:", err);
                return res.status(500).json({ message: "서버 오류 발생" });
            }
            res.status(201).json({message: "리뷰가 성공적으로 등록되었습니다!"})
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });  
    }
}

export const deleteReview = (req: Request, res: Response) => { // 상품 리뷰 삭제 컨트롤러
    const { review_id, product_id } = req.params;
    try {
        let sql = `
            DELETE FROM reviews
            WHERE review_id = ?
            AND product_id = ?;
        `
        const values = [review_id, product_id];

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.error("DB 조회 오류:", err);
                return res.status(500).json({ message: "서버 오류 발생" });
            }
            if (results.affectedRows === 0) {
                console.error("조건에 맞는 행 없음.");
                return res.status(404).end();
            }
            res.status(200).json({message: "리뷰가 성공적으로 삭제되었습니다!"})
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });  
    }
}

export const addReviewLike = async (req: Request, res: Response) => { // 상품 리뷰 좋아요 추가 컨트롤러
    const { review_id } = req.params;

    try {
        const [rows]: any = await conn.promise().query(
            'SELECT review_like FROM reviews WHERE review_id = ?',
            [review_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        const currentLikes = rows[0].review_like;
        const updatedLikes = currentLikes + 1;
        
        await conn.promise().query(
            'UPDATE reviews SET review_like = ? WHERE review_id = ?',
            [updatedLikes, review_id]
        );
        
        return res.status(200).json({ review_like: updatedLikes });
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });  
    }
}

export const addReviewDisLike = async (req: Request, res: Response) => { // 상품 리뷰 싫어요 추가 컨트롤러
    const { review_id } = req.params;

    try {
        const [rows]: any = await conn.promise().query(
            'SELECT review_dislike FROM reviews WHERE review_id = ?',
            [review_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        const currentDislikes = rows[0].review_dislike;
        const updatedDislikes = currentDislikes + 1;
        
        await conn.promise().query(
            'UPDATE reviews SET review_like = ? WHERE review_id = ?',
            [updatedDislikes, review_id]
        );
        
        return res.status(200).json({ review_like: updatedDislikes });
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });  
    }
}

export const modifyReview = (req: Request, res: Response) => { // 상품 리뷰 수정 컨트롤러
    const { review_id } = req.params;
    const { review_content, review_rating } = req.body;

    try {
        let sql = `
            UPDATE reviews
            SET 
                review_content = ?, 
                review_rating = ?
            WHERE 
                review_id = ?;
        `

        const values = [review_content, review_rating, review_id]

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.error("DB 조회 오류:", err);
                return res.status(500).json({ message: "서버 오류 발생" });
            }
            res.status(200).json({message: "리뷰가 성공적으로 수정되었습니다!"})
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });  
    }
}