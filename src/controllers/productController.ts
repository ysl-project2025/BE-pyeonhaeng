import { Request, Response } from 'express';
const conn = require('../db');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()

export const productAllView = (req: Request, res: Response) => { // 상품 목록 전체 조회 컨트롤러
    let { page } = req.query;
    const pageNumber = Number(page);
    const limit = 9;
    const offset = (pageNumber - 1) * limit;

    try {
        let sql = `
            SELECT
                product_id,
                product_name,
                product_image_url,
                product_price,
                is_new
            FROM
                products
            LIMIT ? OFFSET ?;
        `
        const values = [limit, offset];

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.log("쿼리 실행 중 에러 발생:", err)
                return res.status(500).end()
            }
            res.status(200).json({ data: results });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productView = async (req: Request, res: Response) => { // 상품 목록 개별 조회 컨트롤러
    const { product_id } = req.params;
    try {
        const [rows]: any = await conn.promise().query(
            'SELECT view_count FROM products WHERE product_id = ?',
            [product_id]
        );
        const currentViews = rows[0].view_count;
        const updatedViews = currentViews + 1;

        await conn.promise().query(
            'UPDATE products SET view_count = ? WHERE product_id = ?',
            [updatedViews, product_id]
        );
        
        let sql = `
            SELECT
                product_id,
                product_image_url,
                product_name,
                product_price,
                is_new
            FROM
                products
            WHERE
                product_id = ?;
        `
        conn.query(sql, product_id, (err: any, results: any) => {
            if (err) {
                console.log("쿼리 실행 중 에러 발생", err)
                return res.status(500).end()
            }
            if (results.length === 0) {
                console.log("상품 없음");
                return res.status(404).end()
            }
            res.status(200).json({ data: results[0] });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productBookmarkAdd = (req: Request, res: Response) => { // 상품 즐겨찾기 등록 컨트롤러
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id } = req.user;

    if (!user_id) {
        return res.status(401).json({ message: "해당 user_id가 없습니다." });
    }

    const { product_id } = req.params;
    if (!product_id) {
        return res.status(400).json({ message: 'product_id가 누락되었습니다.' });
    }
    
    try {
        const checkProductSql = `SELECT product_id FROM products WHERE product_id = ?`;
        conn.query(checkProductSql, [product_id], (checkErr: any, checkResults: any) => {
            if (checkErr) {
                console.error('상품 조회 중 에러 발생', checkErr);
                return res.status(500).json({ message: '서버 내부 오류 발생' });
            }

            // 상품이 없는 경우
            if (!checkResults || checkResults.length === 0) {
                return res.status(404).json({ message: '해당 상품을 찾을 수 없습니다.' });
            }
        })

        let sql = `
            INSERT INTO bookmark_product (user_id, product_id)
            VALUES (?, ?);
        `
        const values = [user_id, product_id];
        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.log("파라미터 누락")
                return res.status(500).end()
            }
            res.status(201).json({ message: "즐겨찾기 등록 성공!" });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productBookmarkDelete = (req: Request, res: Response) => { // 상품 즐겨찾기 삭제 컨트롤러
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id } = req.user;

    if (!user_id) {
        return res.status(401).json({ message: "해당 user_id가 없습니다." });
    }

    const { product_id } = req.params;
    if (!product_id) {
        return res.status(400).json({ message: 'product_id가 누락되었습니다.' });
    }

    try {
        const sql = `
        DELETE FROM bookmark_product
        WHERE user_id = ? AND product_id = ?;
        `;
        const values = [user_id, product_id];

        conn.query(sql, values, (err: any, results: any) => {
        if (err) {
            console.error("북마크 삭제 중 에러 발생", err);
            return res.status(500).json({ message: "잘못된 요청입니다." });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "삭제할 즐겨찾기 항목을 찾을 수 없습니다." });
        }
        res.status(200).json({ message: "즐겨찾기 삭제 성공" });
        });
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productFindName = (req: Request, res: Response) => {
    const { product_name } = req.params;
    try {
        let sql = `
            SELECT *
            FROM products
            WHERE product_name LIKE CONCAT('%', ?, '%');
        `
        conn.query(sql, product_name, (err: any, results: any) => {
            if (err) {
                console.error("에러 발생", err);
                return res.status(500).json({ message: "잘못된 요청입니다." });
            }
            res.status(200).json({ data: results })
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productFindView = async (req: Request, res: Response) => {
    try {
        let sql = `
        SELECT product_id, product_name, product_image_url, product_price, is_new
        FROM products
        ORDER BY view_count DESC;
        `
        const [results] = await conn.promise().query(sql)
        res.status(200).json({ data: results });
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productFindNew = async (req: Request, res: Response) => {
    try {
        let sql = `
            SELECT product_id, product_name, product_image_url, product_price, is_new
            FROM products
            WHERE is_new = 1;
        `
        const [results] = await conn.promise().query(sql)
        res.status(200).json({ data: results });
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productFindScore = (req: Request, res: Response) => {
    try {
        let sql = `
            SELECT p.product_id,
                p.product_name,
                p.product_image_url,
                p.product_price,
                p.is_new
            FROM products p
            JOIN (
                SELECT product_id, AVG(review_rating) AS avg_rating
                FROM reviews
                GROUP BY product_id
            ) r ON p.product_id = r.product_id
            ORDER BY r.avg_rating DESC;
        `
        conn.query(sql, (err: any, results: any) => {
            if (err) {
                console.error("에러 발생", err);
                return res.status(500).json({ message: "잘못된 요청입니다." });
            }
            res.status(200).json({ data: results });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const productFindReview = (req: Request, res: Response) => {
    try {
        let sql = `
            SELECT p.product_id,
                p.product_name,
                p.product_image_url,
                p.product_price,
                p.is_new
            FROM products p
            LEFT JOIN reviews r ON p.product_id = r.product_id
            GROUP BY p.product_id, p.product_name, p.product_image_url, p.product_price, p.is_new
            ORDER BY COUNT(r.product_id) DESC;
        `
        conn.query(sql, (err: any, results: any) => {
            if (err) {
                console.error("에러 발생", err);
                return res.status(500).json({ message: "잘못된 요청입니다." });
            }
            res.status(200).json({ data: results });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}