const router = express.Router();
import { join } from "../controllers/authController";

router.use(express.json());

router.post('/login', join)