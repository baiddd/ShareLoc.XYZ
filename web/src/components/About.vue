<template>
  <div class="about">
    <!-- <md-subheader>Options</md-subheader> -->
    <md-subheader>About shareLoc.xyz</md-subheader>
    <md-card>
      <md-card-header>
       </md-card-header>
      <md-card-content class="centered-fixed">
        <md-icon class="md-size-5x md-small-hide" md-src="static/img/anna-palm-icon-circle.svg" />
        <!-- <h2>Cite shareLoc.xyz</h2>
        <p> </p> -->
        <h2>Acknowledgements</h2>
        <p>shareLoc.xyz project is mainly supported by
        </p>
        <p><a href="https://www.pasteur.fr" target="_blank">
       <img id="ip-img" src="static/img/Institut_Pasteur_logo.svg" alt="Institut Pasteur">
       </a></p>
        <br>
        <p>About the <a href="#/viewer" target="_blank">SMLM Viewer</a>: the 3D rendering part of is built based on <a href="https://twitter.com/Flexi23" target="_blank">Felix Woitzel</a>'s <a href="https://github.com/Flexi23/pointcloud-loader/" target="_blank">pointcloud-loader</a>, which is licensed under Apache License V2.0. We also thank <a href="https://twitter.com/christlet" target="_blank">Christophe Leterrier</a> who actively promotes the tool.</p>
        <!-- <md-button @click="api.contact" class="md-raised">Contact us</md-button> -->
      </md-card-content>
    </md-card>
    <faq>
    </faq>
    <br>
    <br>
    <md-divider></md-divider>
    <main-footer/>
  </div>
</template>

<script>
export default {
  name: 'about',
  data () {
    return {
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
.about{
  overflow-y: auto !important;
}
.centered-fixed{
  max-width: 800px;
  margin: 0 auto;
  text-align:center;
}
</style>
