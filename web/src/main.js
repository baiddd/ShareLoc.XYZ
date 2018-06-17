// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import router from './router'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css' // This line here

import Navbar from '@/components/Navbar'
import LoginDialog from '@/components/LoginDialog'
import SampleDialog from '@/components/SampleDialog'
import Viewer from '@/components/Viewer'
import Files from '@/components/Files'
import Password from '@/components/Password'
import Footer from '@/components/Footer'
import About from '@/components/About'
import Repository from '@/components/Repository'
import TOS from '@/components/TOS'
import FAQ from '@/components/FAQ'
import Whiteboard from '@/components/Whiteboard'
import Joy from '@/components/Joy'
import store from './store.js'
import App from './App'
import vueSlider from 'vue-slider-component'

Vue.config.productionTip = false

Vue.use(VueMaterial)

// register
Vue.component('vue-slider', vueSlider)
Vue.component('navbar', Navbar)
Vue.component('files', Files)
Vue.component('login-dialog', LoginDialog)
Vue.component('sample-dialog', SampleDialog)
Vue.component('viewer', Viewer)
Vue.component('password', Password)
Vue.component('main-footer', Footer)
Vue.component('about', About)
Vue.component('tos', TOS)
Vue.component('faq', FAQ)
Vue.component('whiteboard', Whiteboard)
Vue.component('joy', Joy)
Vue.component('repository', Repository)

const truncate = function(text, length, clamp){
    clamp = clamp || '...';
    const node = document.createElement('div');
    node.innerHTML = text;
    const content = node.textContent;
    return content.length > length ? content.slice(0, length) + clamp : content;
};

Vue.filter('truncate', truncate);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  data: {
    store: store,
    router: router
  },
  template: '<App/>',
  components: {App}
})
