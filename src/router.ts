import { Router } from 'itty-router';
import { searchTimezone, getTimezone } from './routes/timezone';
import {success,fail} from "./utils/response";
import {define, random} from "./routes/urbandictionary";

const router = Router();

router.get('/timezone/search', searchTimezone);
router.get('/timezone/get', getTimezone);

router.get('/urbandictionary/define', define);
router.get('/urbandictionary/random', random);

router.all('*', () => fail('Not Found', 404 ));

export default router;
