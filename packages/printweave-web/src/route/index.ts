import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/MyPage.vue'),
        meta: {
            title: 'Home',
        },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
