import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdvisorView from '../views/AdvisorView.vue'
import DemandInputView from '../views/DemandInputView.vue'
import RecommendationView from '../views/RecommendationView.vue'
import ChatView from '../views/ChatView.vue'
import CompareView from '../views/CompareView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import ProductCatalogView from '../views/ProductCatalogView.vue'
import ExhibitionView from '../views/ExhibitionView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/advisor', name: 'advisor', component: AdvisorView },
    { path: '/demand', name: 'demand', component: DemandInputView },
    { path: '/recommendation', name: 'recommendation', component: RecommendationView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/compare', name: 'compare', component: CompareView },
    { path: '/product/:id', name: 'product-detail', component: ProductDetailView },
    { path: '/products', name: 'catalog', component: ProductCatalogView },
    { path: '/exhibition', name: 'exhibition', component: ExhibitionView }
  ]
})

export default router
