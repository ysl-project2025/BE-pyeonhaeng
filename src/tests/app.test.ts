import request from 'supertest';
import app from '../app';
const conn = require('../db');
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

// 테스트 환경 PRIVATE_KEY 설정 (env에 설정되어 있지 않다면)
if (!process.env.PRIVATE_KEY) {
  process.env.PRIVATE_KEY = 'testkey';
}

describe('Member Auth Tests', () => {
  // 테스트에서 사용할 유저 정보
  const testUser = {
    user_id: 'test123',
    user_password: 'password123',
    user_name: 'TestUser',
  };

  // 각 테스트 시작 전에 DB에서 테스트 데이터를 삭제
  beforeEach(async () => {
    await new Promise((resolve, reject) => {
      conn.query(
        'DELETE FROM users WHERE user_id = ?',
        [testUser.user_id],
        (err: any) => {
          // 에러 발생시에도 다음 테스트에 영향 없도록 resolve
          resolve(true);
        }
      );
    });
  });

  // 모든 테스트 종료 후 테스트 데이터 삭제
  afterAll(async () => {
    const freshConn = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      database: 'pyeonhaeng',
      dateStrings: true,
    });
    
    await new Promise((resolve, reject) => {
      freshConn.query(
        'DELETE FROM users WHERE user_id = ?',
        [testUser.user_id],
        (err: any) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
    freshConn.end();
  });

  // 1) 회원가입 성공 케이스
  it('회원가입 성공 케이스', async () => {
    const res = await request(app)
      .post('/member/register')
      .send(testUser);

    expect(res.status).toBe(201);
  });

  // 2) 로그인 성공 케이스
  it('로그인 성공 케이스', async () => {
    await request(app).post('/member/register').send(testUser);

    const res = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });

    expect(res.status).toBe(200);
  });

  // 3) 로그인 실패 케이스 (비밀번호 틀림)
  it('로그인 실패 케이스 (비밀번호 틀림)', async () => {
    await request(app).post('/member/register').send(testUser);

    const res = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  // 4) 중복 회원가입 시도 케이스
  it('중복 회원가입 시도 케이스', async () => {
    await request(app).post('/member/register').send(testUser);

    const res = await request(app)
      .post('/member/register')
      .send(testUser);

    expect(res.status).toBe(409);
  });

  // 5) 회원 정보 조회 성공 케이스
  it('회원 정보 조회 성공 케이스', async () => {
    // 회원가입 및 로그인 진행
    await request(app).post('/member/register').send(testUser);
    const loginRes = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });

    // 쿠키에서 token 추출 (쿠키 문자열 예: "token=xxx; Path=/; HttpOnly")
    const cookies = loginRes.headers['set-cookie'];
    let token = '';
    if (cookies && cookies[0]) {
      token = cookies[0].split(';')[0].split('=')[1];
    }
    
    const res = await request(app)
      .get('/member')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // 반환 결과가 배열 형태로 회원 정보 객체를 포함한다고 가정
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        user_id: testUser.user_id,
        user_name: testUser.user_name,
      })
    ]));
  });

  // 6) 회원 정보 수정 성공 케이스
  it('회원 정보 수정 성공 케이스', async () => {
    await request(app).post('/member/register').send(testUser);
    const loginRes = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });
      
    const cookies = loginRes.headers['set-cookie'];
    let token = '';
    if (cookies && cookies[0]) {
      token = cookies[0].split(';')[0].split('=')[1];
    }
    
    const newUserName = 'UpdatedUser';
    const res = await request(app)
      .put('/member/modify')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_name: newUserName });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user_id: testUser.user_id,
      user_name: newUserName,
    });
  });

  // 7) 회원 탈퇴 성공 케이스
  it('회원 탈퇴 성공 케이스', async () => {
    await request(app).post('/member/register').send(testUser);
    const loginRes = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });
      
    const cookies = loginRes.headers['set-cookie'];
    let token = '';
    if (cookies && cookies[0]) {
      token = cookies[0].split(';')[0].split('=')[1];
    }
    
    const res = await request(app)
      .delete('/member/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_password: testUser.user_password });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "회원 탈퇴가 완료되었습니다.",
    });
  });

  // 8) 로그아웃 성공 케이스
  it('로그아웃 성공 케이스', async () => {
    await request(app).post('/member/register').send(testUser);
    const loginRes = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });
      
    const cookies = loginRes.headers['set-cookie'];
    
    // 로그아웃은 쿠키 기반이므로, 쿠키 헤더 그대로 전송
    const res = await request(app)
      .post('/member/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "로그아웃 되었습니다.",
    });
  });

  // 9) 로그아웃 실패 케이스 (토큰 없음)
  it('로그아웃 실패 케이스 (토큰 없음)', async () => {
    const res = await request(app)
      .post('/member/logout'); // 쿠키 없이 요청

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: "해당 토큰 없음",
    });
  });
});
