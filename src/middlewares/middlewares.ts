import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator')

interface JwtPayload {
  user_id: string;
  user_name: string;
  // 추가적인 속성이 있다면 여기에 정의
}

declare global { // Request에 user 존재 가능하게 함
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
    }
  }
}

export const validate = (req: any, res: any, next: any) => { // 검증 미들웨어
    const err = validationResult(req)
    if (!err.isEmpty()) {
        return res.status(400).json(err.array())
    } else {
        return next()
    }
}

export const ensureAuthorization = (req: Request, res: Response, next: NextFunction) => {
    try {
        // 우선 헤더에서 토큰 확인, 없으면 쿠키에서 확인
        let receivedJwt = req.headers["authorization"] || req.cookies?.token;
        if (!receivedJwt) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        // 헤더에 "Bearer " 접두사가 있을 경우 처리
        const token = typeof receivedJwt === 'string' && receivedJwt.startsWith('Bearer ')
            ? receivedJwt.split(' ')[1]
            : receivedJwt;
        console.log("received jwt: ", token);

        // JWT 토큰 검증
        let decodedJwt = jwt.verify(token, process.env.PRIVATE_KEY as string);
        console.log("decoded jwt: ", decodedJwt);

        req.user = decodedJwt as JwtPayload;
        next();
    } catch (error) {
        console.error("JWT 검증 에러:", error);
        return res.status(401).json({message: 'Unauthorized Invalid token'})
    }
}