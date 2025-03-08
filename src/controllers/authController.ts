import { Request, Response } from 'express';
const conn = require('../db');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config()

export const login = (req: Request, res: Response) => {
    const { user_id, user_password } = req.body;
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
                res.status(403).json({
                    message : "이메일 또는 비밀번호가 틀렸습니다."
                })
        }
    })
}   

export const register = async (req: Request, res: Response) => {
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
                    return res.status(400).end()
            }
            res.status(201).json(results)
        })
    } catch (err) {
        return res.status(400).end()
    }
}