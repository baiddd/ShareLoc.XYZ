<template>
  <div class="home">
  <!-- <md-card>
    <md-card-header> -->

      <!-- <md-icon class="md-size-5x md-small-hide" md-src="static/img/shareLoc.xyz-icon-circle.svg" /> -->
      <md-toolbar v-if="showAlert">
            <div class="md-toolbar-row"  flex>
              <p class="alert">Notice: we recently fixed a bug occured when importing large csv file to ShareLoc, the fixed version produces 1.3GB smlm file with 7.2GB csv file (<a target="_blank" href="https://github.com/imodpasteur/smlm-file-format">more details</a>).</p>
              <div class="md-toolbar-section-end" >
                <md-button class="md-icon-button" @click="showAlert=false"> <md-icon>close</md-icon></md-button>
              </div>
            </div>
      </md-toolbar>
      <div class="md-toolbar-row md-layout md-alignment-center-center">
        <div class="banner-container">
          <img src="/static/img/bg.jpg" alt="banner"></img>
          <div class="subtitle">A platform for sharing localization microscopy data.<br>
            <md-button class="md-raised" href="https://github.com/imodpasteur/smlm-file-format/blob/master/README.md" target="_blank">SMLM file format</md-button>
            <md-button class="md-raised md-accent"  to="/viewer">SMLM viewer</md-button>
         </div>
        </div>
      </div>
      <!-- <md-toolbar class="md-transparent md-dense" md-elevation="0">
        <div class="md-toolbar-row" flex>
            <div class="md-toolbar-section-end" >
              <md-button  href="https://github.com/imodpasteur/shareLoc.xyz" target="_blank"><md-icon md-src="static/img/github.svg" class="md-size-1x svg-icon"></md-icon>source code</md-button>
              <md-button  @click="shareOnTwitter"><md-icon md-src="static/img/twitter.svg" class="md-size-1x svg-icon"></md-icon>share</md-button>
            </div>
        </div>
      </md-toolbar> -->
       <br>
       <repository :show-tags="false" :title="null"></repository>
  <md-dialog :md-active.sync="showDialog">
    <md-dialog-title>Getting Started: the shareLocViewer</md-dialog-title>
      <md-dialog-content>
        <p>With the shareLocViewer web app, you render and analyse your data  within the browser, no installation, open a localization table and process instantly.</p>
        <md-button class="md-raised md-primary" to="viewer">Start</md-button>
        <p>You can render your data with the viewer anonymously, for the sharing and shareLoc.xyz feature you will be asked to login, please <a @click="showDialog=false; api.showLogin()">sign up</a> in advance.</p>
        <p>We are actively improving the shareLoc.xyz web platform, please <a @click="showDialog=false; api.showLogin()">sign up</a> with your e-mail to be notified when new features are available.</p>
    </md-dialog-content>
    <md-dialog-actions>
      <md-button class="md-primary" @click="showDialog=false">OK</md-button>
    </md-dialog-actions>
  </md-dialog>
  <br>
  <br>
  <md-divider></md-divider>
  <main-footer/>
</div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'home',
  data () {
    return {
      showAlert: false,
      showDialog: false,
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    const disable_date = new Date(Date.UTC(2018, 8, 3, 12, 0, 0))
    const now = new Date(Date.now())
    if(now<disable_date){
      setTimeout(()=>{
         this.showAlert = true
      },500);
    }
  },
  methods: {
    shareOnTwitter(){
      const url = "https://shareloc.xyz";
      const text = " #ShareLoc ";
      window.open('http://twitter.com/share?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text), '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.subtitle {
  text-align: center;
  font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 320;
  font-size: 3.5em;
  margin: 0 auto;
  line-height: 110%;
  display: block;
  max-width: 1100px;
  padding: 50px 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.banner-container {
  position: relative;
  text-align: center;
  color: white;
}

.floating-centered{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.home-carousel{
  max-height: 90vh;
}
.legend {
  padding-left: 10px;
}
@media screen and (max-width: 600px) {
  .subtitle {
    font-size: 1.3em;
  }
}
.svg-icon{
  display: inline-block;
}
.carousel-img{
  min-width: 80%;
}

.centered-item{
  margin: 0 auto;
  text-align:center;
}

.fixed-content{
  padding: 3px;
  max-width: 1000px;
  text-align: center;
  margin: 0 auto;
}
.centered-fixed-card{
  max-width: 800px;
  margin: 0 auto;
  text-align:center;
}
/* .slide-1 {

  background-image: url('/static/img/scaled-movie-4.gif');
} */


.video-wrapper {
    position: relative;
}

.video-wrapper > video {
    width: 100%;
    vertical-align: middle;
}

.video-wrapper > video.has-media-controls-hidden::-webkit-media-controls {
    display: none;
}

.video-overlay-play-button {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 10px calc(50% - 50px);
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    display: block;
    opacity: 0.95;
    cursor: pointer;
    /* background-image: linear-gradient(transparent, rgba(10,10,10,0.4)); */
    transition: opacity 150ms;
}

.video-overlay-play-button:hover {
    opacity: 1;
}

.video-overlay-play-button.is-hidden {
    display: none;
}

.lower-button{
  text-transform: none;
}
</style>
