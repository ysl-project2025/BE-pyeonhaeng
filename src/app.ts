const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
dotenv.config();

const corsOptions = {
  origin: [process.env.FRONTEND, process.env.FE_LOCAL],
  credentials: true,
};
// CORS 미들웨어 (라우터 등록 전에 적용)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 모든 OPTIONS 요청에 대해 CORS 처리

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});

const authRouter = require("./routes/auth")
const productRouter = require("./routes/product")
const reviewRouter = require("./routes/review")

app.use("/member", authRouter)
app.use("/product", productRouter)
app.use("/review", reviewRouter)

export default app;