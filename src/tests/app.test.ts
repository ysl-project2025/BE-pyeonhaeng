import request from 'supertest';
import app from '../app';
const conn = require('../db');

describe('Member Auth Tests', () => {
  // 매 테스트에서 사용할 유저 정보
  const testUser = {
    user_id: 'test123',
    user_password: 'password123',
    user_name: 'TestUser',
  };

  // 각 테스트가 시작 전, testUser삭제
  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      conn.query(
        'DELETE FROM users WHERE user_id = ?',
        [testUser.user_id],
        (err: any) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  });

  // 모든 테스트가 끝난 후 testUser 삭제
  afterAll(async () => {
    await new Promise((resolve, reject) => {
      conn.query(
        'DELETE FROM users WHERE user_id = ?',
        [testUser.user_id],
        (err: any) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
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
    const res = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });

    expect(res.status).toBe(200);
  });

  // 3) 로그인 실패 케이스 (비밀번호 틀림)
  it('로그인 실패 케이스', async () => {
    const res = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: 'wrongpassword',
      });

    expect(res.status).toBe(403);
  });

  // 4) 중복 회원가입 시도
  it('중복 회원가입 시도 케이스', async () => {
    const res = await request(app)
      .post('/member/register')
      .send(testUser);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
