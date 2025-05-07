import { Router } from 'itty-router';
import { searchTimezone, getTimezone } from './routes/timezone';
import {success,fail} from "./utils/response";

const router = Router();

router.get('/timezone/search', searchTimezone);
router.get('/timezone/get', getTimezone);

router.all('*', () => fail('Not Found', 404 ));

export default router;
