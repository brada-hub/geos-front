import { defineRouter } from '#q-app/wrappers';
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import routes from './routes';

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation Guard: protege rutas y redirige a /login si no hay token
  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('DOCUS_AUTH_TOKEN');
    const isPublic = to.meta.public || to.path === '/login';

    if (!token && !isPublic) {
      next('/login');
    } else if (token && to.path === '/login') {
      next('/');
    } else {
      next();
    }
  });

  return Router;
});
