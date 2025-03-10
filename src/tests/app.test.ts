import request from 'supertest';
import app from '../app';
const conn = require('../db');
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

describe('Member Auth Tests', () => {
  // 매 테스트에서 사용할 유저 정보
  const testUser = {
    user_id: 'test123',
    user_password: 'password123',
    user_name: 'TestUser',
  };

  // 각 테스트 시작 전에 혹시 남아있을 테스트 데이터를 삭제 (이미 존재하는 경우 대비)
  beforeEach(async () => {
    await new Promise((resolve, reject) => {
      conn.query(
        'DELETE FROM users WHERE user_id = ?',
        [testUser.user_id],
        (err: any) => {
          // 에러가 발생해도 다음 테스트에 영향을 주지 않도록 무시
          resolve(true);
        }
      );
    });
  });

  // 모든 테스트가 끝난 후 testUser 삭제 (기존 연결이 종료되었을 수 있으므로 새 연결 사용)
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
    // 먼저 회원가입을 진행
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
    // 회원가입 후 잘못된 비밀번호로 로그인 시도
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
    // 최초 회원가입 진행
    await request(app).post('/member/register').send(testUser);
    // 중복 회원가입 시도
    const res = await request(app)
      .post('/member/register')
      .send(testUser);

    expect(res.status).toBe(409);
  });
});
