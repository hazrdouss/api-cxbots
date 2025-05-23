import { Router } from 'itty-router';
import { searchTimezone, getTimezone } from './routes/timezone';
import {success,fail} from "./utils/response";
import {define, random} from "./routes/urbandictionary";
import {quote} from "./routes/cxbot/commands/quote";
import {checkpermissions} from "./routes/tools/checkpermissions";
import {quotev2} from "./routes/cxbot/commands/quotev2";
import { getGiveawayWinners } from './routes/cxutil/giveGiveawayWinners';

const router = Router();

router.get('/timezone/search', searchTimezone);
router.get('/timezone/get', getTimezone);

router.get('/urbandictionary/define', define);
router.get('/urbandictionary/random', random);

router.get('/cxbot/commands/quote', quote);
router.get('/cxbot/commands/quotev2', quotev2);

router.get('/tools/checkpermissions', checkpermissions)

router.get('/cxutil/getgiveawaywinners', getGiveawayWinners);

router.all('*', () => fail('Not Found', 404 ));

export default router;
