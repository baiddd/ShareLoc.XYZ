<template>
  <div class="footer" v-if="$route.path != '/viewer' && $route.path != '/view'">
    <div class="md-layout md-alignment-center-center">
      <md-button class="md-accent footer-button" target="_blank" @click="api&&api.contact&&api.contact()">Ask a question</md-button>
      <md-button class="md-accent footer-button" target="_blank" href="https://github.com/imodpasteur/shareLoc.xyz/issues">Create an issue on Github</md-button>
    </div>

    <div class="md-layout md-alignment-center-center">
      <md-button class="footer-button" href="https://creativecommons.org/licenses/by/4.0/" target="_blank">
        <md-tooltip>Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license.</md-tooltip>
         <img id="cc-by-img" src="static/img/by.svg" alt="CC BY 4.0"> Site content licensed under CC BY 4.0
      </md-button>

      <md-button class="footer-button" @click="mode='tos';showDialog=true">
        <md-tooltip>By accessing the website, you are agreeing to be bound by the Terms of Service.</md-tooltip>
        Terms of Service</md-button>
      <md-button class="footer-button" @click="mode='about';showDialog=true">About shareLoc.xyz</md-button>
    </div>
    <div class="md-layout md-alignment-center-center">
      <md-button class="footer-button" href="https://github.com/oeway" target="_blank">Made by Wei OUYANG with <span class="red">❤</span></md-button>
      <md-button class="footer-button" target="_blank" href="https://sites.google.com/site/imagingandmodeling/">Powered by Imaging and Modeling Unit</md-button>
      <a href="https://www.pasteur.fr" target="_blank">
      <img id="ip-img" src="static/img/Institut_Pasteur_logo.svg" alt="Institut Pasteur">
      </a>
    </div>


    <md-dialog :md-active.sync="showDialog">
      <md-dialog-content>
        <about v-if="mode=='about'"/>
        <tos v-if="mode=='tos'"/>
      </md-dialog-content>
    <md-dialog-actions>
      <md-button class="md-primary" @click="showDialog=false">OK</md-button>
    </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
export default {
  name: 'main-footer',
  data () {
    return {
      mode: 'about',
      showDialog: false,
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){

  },
  methods: {

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.footer {
  text-align: center;
}
.footer-button{
  text-transform: none;
}
.red{
  display: inline-block;
  color: #f44336;
  transition: .3s;
}
#cc-by-img{
  height: 25px;
}
#ip-img{
  height: 40px;
  margin-bottom: 30px;
}

.holds-the-iframe {
 background: url(/static/img/anna-palm-icon-circle-animation.svg) center center no-repeat;
}
</style>
