import app from './app.js';
import { env } from './config/env.js';

const port = env.port;

app.listen(port, () => {
  console.log(`[Server] Running on port ${port} in ${env.nodeEnv} mode`);
});