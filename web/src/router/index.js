import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Admin from '@/components/Admin'
import Datasets from '@/components/Datasets'
import Options from '@/components/Options'
import Files from '@/components/Files'
import Repository from '@/components/Repository'
import Viewer from '@/components/Viewer'
import ViewerV2 from '@/components/ViewerV2'
import Password from '@/components/Password'
import About from '@/components/About'
import TOS from '@/components/TOS'
import FAQ from '@/components/FAQ'

Vue.use(Router)

export default new Router({
  base: window.location.pathName,
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin
    },
    {
      path: '/datasets',
      name: 'Datasets',
      component: Datasets
    },
    {
      path: '/repository',
      name: 'Repository',
      component: Repository
    },
    {
      path: '/repo',
      redirect: { name: 'Repository' }
    },
    {
      path: '/gallery',
      redirect: { name: 'Repository' }
    },
    {
      path: '/options',
      name: 'Options',
      component: Options
    },
    {
      path: '/files',
      name: 'Files',
      component: Files
    },
    {
      path: '/viewer',
      name: 'Viewer',
      component: Viewer
    },
    {
      path: '/viewer2',
      name: 'ViewerV2',
      component: ViewerV2
    },
    {
      path: '/view',
      name: 'Viewe',
      component: Viewer
    },
    {
      path: '/password/:action',
      name: 'Password',
      component: Password
    },
    {
      path: '/about',
      name: 'About',
      component: About
    },
    {
      path: '/tos',
      name: 'TOS',
      component: TOS
    },
    {
      path: '/faq',
      name: 'FAQ',
      component: FAQ
    }
  ]
})
