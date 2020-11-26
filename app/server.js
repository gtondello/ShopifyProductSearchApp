/*
 * Next.js server setup
 */
require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');

dotenv.config();
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const Router = require('koa-router');
const getSubscriptionUrl = require('./server/getSubscriptionUrl');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const {
    SHOPIFY_API_SECRET_KEY,
    SHOPIFY_API_KEY,
    API_VERSION
} = process.env;

app.prepare().then(() => {
    const server = new Koa();
    const router = new Router();
    server.use(session({ secure: true, sameSite: 'none' }, server));
    server.keys = [SHOPIFY_API_SECRET_KEY];

    // Shop authentication and app subscription
    server.use(
        createShopifyAuth({
            apiKey: SHOPIFY_API_KEY,
            secret: SHOPIFY_API_SECRET_KEY,
            scopes: ['read_products', 'write_products'],
            async afterAuth(ctx) {
                const { shop, accessToken } = ctx.session;
                ctx.cookies.set('shopOrigin', shop, { 
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none'
                });
                await getSubscriptionUrl(ctx, accessToken, shop);
            },
        }),
    );

    // Routes setup
    server.use(graphQLProxy({ version: API_VERSION })) 
    router.get('*', verifyRequest(), async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    });
    server.use(router.allowedMethods());
    server.use(router.routes());

    // Start listening
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});