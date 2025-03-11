# Node.js 20 Alpine 베이스 이미지 사용
FROM node:20-alpine

# 작업 디렉터리 설정
WORKDIR /usr/src/app

# package.json, package-lock.json 복사
COPY package*.json ./

# 필요한 라이브러리 설치
RUN npm install

# 나머지 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# (선택) 8080 포트 공개 선언
EXPOSE 8080

# 서버 실행 (빌드 후 dist/index.js가 생성된다고 가정)
CMD ["npm", "start"]