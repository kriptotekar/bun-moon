// index.js
import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => ({ message: 'Welcome to the Bun + Elysia App! 🚀' }))
  .get('/hello/:name', ({ params }) => {
    return { message: `Hello, ${params.name}!` };
  })
  .post('/data', ({ body }) => {
    console.log('Received data:', body);
    // You would typically validate and process the body here
    return { status: 'success', received: body };
  })
  .listen(3000); // Start the server on port 3000

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
