const http = require('http');
const path = require('path');
const Koa = require('koa');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const uuid = require('uuid');

const app = new Koa();

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const dirPublic = path.join(__dirname, '/public');
app.use(koaStatic(dirPublic));

let todos = [];

class Todos {
  constructor(id, text, completed, created) {
    this.id = id;
    this.text = text;
    this.completed = completed;
    this.created = created;
  }
}

const firstTodo = new Todos(uuid.v4(), 'Тестовое задание', false, new Date());
const secondTodo = new Todos(uuid.v4(), 'Прекрасный код', true, new Date());
const threeTodo = new Todos(uuid.v4(), 'Покрытие тестами', false, new Date());
todos.push(firstTodo);
todos.push(secondTodo);
todos.push(threeTodo);

const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

function fortune(ctx, body = null, status = 200) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0) {
        ctx.response.status = status;
        ctx.response.body = typeof body === 'function' ? body() : body;
        resolve();
        return;
      }

      reject(new Error('Что-то пошло не так'));
    }, 1 * 500);
  });
}

router.get('/api/todos', async (ctx) => {
  const body = todos.map((o) => ({
    id: o.id, text: o.text, completed: o.completed, created: o.created,
  }));
  return fortune(ctx, body);
});

router.delete('/api/todos/:id', async (ctx) => {
  const id = String(ctx.params.id);
  const index = todos.findIndex((o) => o.id === id);
  if (index === -1) {
    const status = 404;
    return fortune(ctx, null, status);
  }
  todos.splice(index, 1);
  return fortune(ctx, todos);
});

router.post('/api/todos', async (ctx) => {
  if (!ctx.request.body) {
    const status = 404;
    return fortune(ctx, null, status);
  }
  todos.push({
    id: uuid.v4(), ...ctx.request.body, completed: false, created: new Date(),
  });
  const body = todos;
  return fortune(ctx, body);
});

router.put('/api/todos/:id', async (ctx) => {
  const id = String(ctx.params.id);
  if (!id) {
    const status = 204;
    return fortune(ctx, null, status);
  }
  todos = todos.map((o) => (o.id === id ? { ...o, completed: !o.completed } : o));
  const body = todos;
  return fortune(ctx, body);
});

router.put('/api/todos', async (ctx) => {
  const id = String(ctx.params.id);
  if (!id) {
    const status = 204;
    return fortune(ctx, null, status);
  }
  todos = todos.map((o) => {
    if (o.completed === false) {
      return o;
    }

    return {
      ...o,
      completed: !o.completed,
    };
  });
  const body = todos;
  return fortune(ctx, body);
});

const port = process.env.PORT || 7575;
const server = http.createServer(app.callback());

// eslint-disable-next-line no-console
server.listen(port, () => console.log('Server started'));
