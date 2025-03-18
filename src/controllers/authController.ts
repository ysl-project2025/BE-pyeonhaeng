import { Request, Response } from 'express';
const conn = require('../db');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()

export const login = (req: Request, res: Response) => { // 로그인 기능
    const { user_id, user_password } = req.body;
    try {
        let sql = 'SELECT user_id, user_password, user_name FROM users WHERE user_id = ?';
        let values = [user_id]
        conn.query(sql, values, async function (err: any, results: any) {
            if (err) {
                console.log("사용자 없음")
                return res.status(400).end()
            }

            var loginUser = results[0];
            if (!loginUser) {
                console.log(err)
                return res.status(400).end()
            }

            const isPasswordValid = await bcrypt.compare(user_password, loginUser.user_password);
            if (isPasswordValid) {
                const token = jwt.sign(
                    {
                        user_id: loginUser.user_id,
                        user_name: loginUser.user_name,
                    },
                    process.env.PRIVATE_KEY,
                    {
                        expiresIn: '1h', // 1시간 뒤 만료
                        issuer: 'pyeonhaeng',
                    }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 쿠키 유효 시간 7일
                });

                res.status(200).json({
                    message: `${loginUser.user_name}님, 로그인 되었습니다.`
                })
            } else {
                res.status(401).json({
                    message: "이메일 또는 비밀번호가 틀렸습니다."
                })
            }
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}   

export const register = async (req: Request, res: Response) => { // 회원가입
    const { user_id, user_password, user_name } = req.body;
    try {
        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(user_password, 10);

        // 데이터베이스에 사용자 정보 저장
        const sql = 'INSERT INTO users (user_id, user_password, user_name) VALUES (?, ?, ?)';
        const values = [user_id, hashedPassword, user_name];

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.log(err)
                return res.status(409).end() // 중복된 아이디 혹은 비밀번호
            }
            res.status(201).json(results)
        })
    } catch (err) {
        return res.status(400).end()
    }
}


export const memberInfo = (req: Request, res: Response) => { // 회원 정보 조회
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id, user_name } = req.user;

    if (!user_id) {
        return res.status(404).json({ message: "해당 user_id가 없습니다." });
    }
    
    try {
        let sql = `
        SELECT
            user_id,
            user_name
        FROM
            users
        WHERE
            user_id = ?
            AND user_name = ?;
        `
        const values = [user_id, user_name];

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.log("사용자 없음")
                return res.status(400).end()
            }
            res.status(200).json(results)
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const memberModify = (req: Request, res: Response) => { // 회원 정보 수정
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id } = req.user;
    const { user_name } = req.body;

    if (!user_id) {
        return res.status(404).json({ message: "해당 user_id가 없습니다." });
    }
    
    try {
        const sql = `
            UPDATE users
            SET user_name = ?
            WHERE user_id = ?;
        `;
        const values = [user_name, user_id];

        conn.query(sql, values, (err: any, results: any) => {
            if (err) {
                console.log("사용자 없음")
                return res.status(400).end()
            }
            res.status(200).json({
                user_id: user_id,
                user_name: user_name
            })
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const memberWithdraw = (req: Request, res: Response) => { // 회원 탈퇴
    if (!req.user || typeof req.user === 'string') {
        return res.status(401).json({ message: '유효한 사용자 정보가 없습니다.' });
    }

    const { user_id } = req.user;
    const { user_password } = req.body;

    if (!user_id) {
        return res.status(404).json({ message: "해당 user_id가 없습니다." });
    }

    try {
        let sql = `
            SELECT user_password
            FROM users
            WHERE user_id = ?
        `
        const value = [user_id]
        conn.query(sql, value, (err: any, results: any) => {
            if (err) {
                console.error("DB 조회 오류:", err);
                return res.status(500).json({ message: "서버 오류 발생" });
            }

            // 사용자가 없는 경우
            if (results.length === 0) {
                return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
            }

            const hashedPassword = results[0].user_password
            const isPasswordValid = bcrypt.compare(user_password, hashedPassword);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." })
            }
        })

        sql = `
            DELETE FROM users
            WHERE user_id = ?;
        `
        conn.query(sql, value, (err: any, results: any) => {
            if (err) {
                console.error("회원 삭제 오류:", err);
                return res.status(500).json({ message: "회원 삭제 중 오류 발생" });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "삭제할 사용자가 없습니다." });
            }

            return res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
        })
    } catch (error) {
        console.error("예상치 못한 오류:", error);
        return res.status(500).json({ message: "서버 내부 오류 발생" });
    }
}

export const logout = (req: Request, res: Response) => { // 로그 아웃
    // 쿠키에 토큰이 존재하지 않는 경우 404 에러 반환
    if (!req.cookies || !req.cookies.token) {
        return res.status(404).json({
            message: "해당 토큰 없음"
        });
    }

    // 'token' 쿠키 제거
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
    });
    
    res.status(200).json({
        message: "로그아웃 되었습니다."
    });
}