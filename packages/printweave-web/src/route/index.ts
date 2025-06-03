import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {isLoggedIn} from "@/helpers/auth.ts";

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Homepage.vue'),
        meta: {
            title: 'Home',
        },
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/Login.vue'),
        meta: {
            title: 'Login',
        },
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
            title: 'Dashboard',
            requiresAuth: true,
        },
    },
    {
        path: '/dashboard/printer/:printerId',
        name: 'printerDetails',
        component: () => import('@/views/PrinterDetails.vue'),
        meta: {
            title: 'Printer Details',
            requiresAuth: true,
        },
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        console.log('Checking authentication for route:', to.name)
        console.log('Is user logged in?', await isLoggedIn())
        if (!(await isLoggedIn())) {
            console.warn('User is not authenticated, redirecting to login')
            next({ name: 'login' })
        } else {
            console.log('User is authenticated, proceeding to:', to.name)
            next()
        }
    } else {
        next()
    }
});

export default router
