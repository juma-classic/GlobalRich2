import {
    registerRoute as workbox_routing_registerRoute
} from '/vercel/path0/node_modules/workbox-routing/registerRoute.mjs';
import {
    ExpirationPlugin as workbox_expiration_ExpirationPlugin
} from '/vercel/path0/node_modules/workbox-expiration/ExpirationPlugin.mjs';
import {
    CacheFirst as workbox_strategies_CacheFirst
} from '/vercel/path0/node_modules/workbox-strategies/CacheFirst.mjs';
import {
    clientsClaim as workbox_core_clientsClaim
} from '/vercel/path0/node_modules/workbox-core/clientsClaim.mjs';
/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */








self.skipWaiting();

workbox_core_clientsClaim();



workbox_routing_registerRoute(/public\/(images|sprites)\/(?!.*favicons).*$/, new workbox_strategies_CacheFirst({
    "cacheName": "assets",
    plugins: [new workbox_expiration_ExpirationPlugin({
        maxAgeSeconds: 86400
    })]
}), 'GET');
workbox_routing_registerRoute(({
    url
}) => {
    return url.pathname.match(/^\/js\/(?!(.*((core\.[a-z_]*-json\.)|smartcharts))).*$/);
}, new workbox_strategies_CacheFirst({
    "cacheName": "core-js-files",
    plugins: [new workbox_expiration_ExpirationPlugin({
        maxAgeSeconds: 86400
    })]
}), 'GET');
workbox_routing_registerRoute(({
    url
}) => {
    return url.pathname.match(/^\/js\/(smartcharts)\//);
}, new workbox_strategies_CacheFirst({
    "cacheName": "smartchart-files",
    plugins: [new workbox_expiration_ExpirationPlugin({
        maxAgeSeconds: 86400
    })]
}), 'GET');
workbox_routing_registerRoute(({
    url
}) => {
    return url.pathname.match(/^\/css\//);
}, new workbox_strategies_CacheFirst({
    "cacheName": "core-css-files",
    plugins: [new workbox_expiration_ExpirationPlugin({
        maxAgeSeconds: 86400
    })]
}), 'GET');
workbox_routing_registerRoute(/(account|appstore|bot|cashier|cfd|trader|reports)\//, new workbox_strategies_CacheFirst({
    "cacheName": "packages-files",
    plugins: [new workbox_expiration_ExpirationPlugin({
        maxAgeSeconds: 86400
    })]
}), 'GET');