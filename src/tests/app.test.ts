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
  let testUser: { user_id: string; user_password: string; user_name: string };
  let connection: mysql.Connection;  // 커넥션 객체 추가

  beforeEach(async () => {
    // 각 테스트마다 고유한 사용자 ID 생성
    testUser = {
      user_id: `test_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      user_password: 'password123',
      user_name: 'TestUser',
    };

    // 테스트 시작 전 해당 사용자가 남아있다면 삭제
    connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      database: 'pyeonhaeng',
      dateStrings: true,
    });

    await new Promise((resolve, reject) => {
      connection.query('DELETE FROM users WHERE user_id = ?', [testUser.user_id], (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  });

  afterEach(async () => {
    // 테스트 종료 후 사용자 데이터 삭제
    await new Promise((resolve, reject) => {
      connection.query('DELETE FROM users WHERE user_id = ?', [testUser.user_id], (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });

    // DB 연결 종료
    await new Promise<void>((resolve, reject) => {
      connection.end((err) => {
        if (err) return reject(err);
        resolve();
      });
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
    const firstRes = await request(app)
      .post('/member/register')
      .send(testUser);
    expect(firstRes.status).toBe(201);
    const secondRes = await request(app)
      .post('/member/register')
      .send(testUser);
    expect(secondRes.status).toBe(409);
  });

  // 5) 회원 정보 조회 성공 케이스
  it('회원 정보 조회 성공 케이스', async () => {
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
      .get('/member')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: testUser.user_id,
          user_name: testUser.user_name,
        }),
      ])
    );
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
    const res = await request(app).post('/member/logout');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: "해당 토큰 없음",
    });
  });
});

describe('Product API Tests', () => {
  let testUser = {
    user_id: `prodUser_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    user_password: 'prodPassword',
    user_name: 'ProdUser',
  };

  const testProduct = {
    product_id: 123,
    product_name: 'Test Product',
    product_image_url: 'http://example.com/test.png',
    product_price: 1000,
    is_new: 1,
  };

  let token = '';

  beforeAll(async () => {
    await request(app).post('/member/register').send(testUser);
    const loginRes = await request(app)
      .post('/member/login')
      .send({
        user_id: testUser.user_id,
        user_password: testUser.user_password,
      });
    const cookies = loginRes.headers['set-cookie'];
    if (cookies && cookies[0]) {
      token = cookies[0].split(';')[0].split('=')[1];
    }

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
        `INSERT INTO products (product_id, product_name, product_image_url, product_price, is_new)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_name = VALUES(product_name)`,
        [
          testProduct.product_id,
          testProduct.product_name,
          testProduct.product_image_url,
          testProduct.product_price,
          testProduct.is_new,
        ],
        (err: any) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
    freshConn.end();
  });

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
        'DELETE FROM products WHERE product_id = ?',
        [testProduct.product_id],
        (err: any) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
    freshConn.end();
  });

  // 1) 상품 목록 전체 조회 케이스
  it('상품 목록 전체 조회 케이스', async () => {
    const res = await request(app)
      .get('/product')
      .query({ page: 1 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 2) 상품 개별 조회 성공 케이스
  it('상품 개별 조회 성공 케이스', async () => {
    const res = await request(app)
      .get(`/product/${testProduct.product_id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({
      product_id: testProduct.product_id,
      product_name: testProduct.product_name,
    });
  });

  // 3) 상품 개별 조회 실패 케이스 (존재하지 않는 상품)
  it('상품 개별 조회 실패 케이스', async () => {
    const res = await request(app)
      .get('/product/999999') // 존재하지 않는 상품 ID 사용
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // 4) 상품 즐겨찾기 등록 성공 케이스
  it('상품 즐겨찾기 등록 성공 케이스', async () => {
    const res = await request(app)
      .get(`/product/add/${testProduct.product_id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "즐겨찾기 등록 성공!"
    });
  });

  // 5) 상품 즐겨찾기 삭제 성공 케이스
  it('상품 즐겨찾기 삭제 성공 케이스', async () => {
    // 먼저 즐겨찾기 등록 후 삭제
    await request(app)
      .get(`/product/add/${testProduct.product_id}`)
      .set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .get(`/product/delete/${testProduct.product_id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "즐겨찾기 삭제 성공"
    });
  });
});
