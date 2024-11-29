// app.js

// 실행
// yarn run dev
// nodemon app.js

import express from 'express';
import CharactersRouter from './routes/charactors.router.js';
import EditorRouter from './routes/editor.router.js';
import ItemsRouter from './routes/items.router.js';
import ShopRouter from './routes/shop.router.js';

const app = express();
const PORT = 3017;

app.use(express.json());
app.use('/api', [CharactersRouter, EditorRouter, ItemsRouter, ShopRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});
