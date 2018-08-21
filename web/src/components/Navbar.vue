<template>
  <div class="md-toolbar-row">
      <div class="md-toolbar-row" flex>
          <md-button to="/">
            <div class="site-title">shareLoc.xyz<span class="superscript">alpha</span></div>
          </md-button>

          <span v-show="$route.path!='/'" class="md-layout-item md-medium-hide subheader-title">Localization Data Sharing Made Easy</span>

          <div class="md-toolbar-section-end">
            <md-menu md-size="medium" v-if="screenWidth<600">
              <md-button class="md-primary md-icon-button" md-menu-trigger>
                <md-icon>menu</md-icon>
              </md-button>
              <md-menu-content>
                <md-menu-item class="md-primary md-button menu-button" v-show="!store.signed_in" @click="api.showLogin()"> Login/Signup </md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" v-show="$route.path != '/'" to="/">Home</md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" v-show="$route.path != '/viewer' && $route.path != '/view'" to="/viewer">Viewer</md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" v-show="$route.path != '/repository'" to="/repository">Repository</md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" v-show="$route.path != '/about'" to="/about">About</md-menu-item>
              </md-menu-content>
             </md-menu>

            <md-button v-show="$route.path != '/'" class="md-accent" v-if="screenWidth>=600" to="/">
              <md-icon>home</md-icon> Home
              <md-tooltip>Home Page</md-tooltip>
            </md-button>
            &nbsp;
            <md-button v-show="$route.path != '/viewer' && $route.path != '/view'" class="md-accent" v-if="screenWidth>=600" to="/viewer">
              <md-icon>pageview</md-icon> Viewer
              <md-tooltip>SMLM data viewer</md-tooltip>
            </md-button>
            <!-- &nbsp;
            <md-button v-show="$route.path != '/dashboard'" class="md-accent" to="/dashboard">
              <md-icon>widgets</md-icon> Dashboard
              <md-tooltip>models</md-tooltip>
            </md-button> -->
            &nbsp;
            <md-button v-show="$route.path != '/repository'" class="md-accent" v-if="screenWidth>=600" to="/repository">
              <md-icon>insert_photo</md-icon> Repository
              <md-tooltip>datasets</md-tooltip>
            </md-button>
            &nbsp;
            <md-button v-show="$route.path != '/about'" class="md-accent" v-if="screenWidth>=600" to="/about">
              <md-icon>info</md-icon> About
              <md-tooltip>About shareLoc.xyz</md-tooltip>
            </md-button>
            &nbsp;
            &nbsp;
            <md-button class="md-accent" id="login-btn" v-if="screenWidth>=600 && !store.signed_in" @click="api.showLogin()">
                Login/Sign Up<!-- <md-icon>person</md-icon> -->
            </md-button>
            <md-menu md-size="medium" v-show="store.signed_in">
              <md-button class="md-raised md-accent md-icon-button" md-menu-trigger>
                <md-icon>person</md-icon>
                <md-tooltip> {{store.uid || store.authid}}</md-tooltip>
              </md-button>
              <md-menu-content>
                <md-menu-item class="md-primary md-button menu-button" v-if="store.authrole=='admin'" to="/admin"><div>admin</div></md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" v-if="store.authrole=='admin'" to="/datasets"><div>datasets</div></md-menu-item>
                <md-menu-item class="md-primary md-button menu-button" to="/options"><div>options</div></md-menu-item>
                <md-menu-item class="md-warn md-button menu-button" @click="api.logout"><div>sign out</div></md-menu-item>
              </md-menu-content>
             </md-menu>
          </div>

      </div>
      <md-snackbar :md-position="'center'" class="md-accent" :md-active.sync="showSnackbar" :md-duration="snackbar_duration">
       <span>{{snackbar_info}}</span>
       <md-button class="md-accent" @click="showSnackbar=false">close</md-button>
      </md-snackbar>

      <!-- <md-button @click="api.showLogin()">
          Data
      </md-button>
      <md-button @click="api.showLogin()">
          Model
      </md-button> -->

       <login-dialog label="login/signup"> </login-dialog>
       <md-dialog :md-active.sync="showQuestion" id="question-dialog">
         <md-toolbar class="md-primary">
           <div class="md-toolbar-row" flex>
             <md-subheader>
               Contact us
             </md-subheader>
             <div class="md-toolbar-section-end" >
               <md-button class="md-icon-button" @click="showQuestion=false"> <md-icon>close</md-icon></md-button>
             </div>
           </div>
         </md-toolbar>
         <md-dialog-content>
           <div class="holds-the-iframe"><iframe id="typeform-full" width="100%" height="100%" frameborder="0" src="https://oeway.typeform.com/to/rdkPmd"></iframe></div>
         </md-dialog-content>
         <md-dialog-actions>
           <md-button class="md-primary" @click="showQuestion=false">Close</md-button>
         </md-dialog-actions>
       </md-dialog>
  </div>
</template>

<script>
export default {
  name: 'navbar',
  data () {
    return {
      snackbar_info: "",
      snackbar_duration: 1000,
      showSnackbar: false,
      showQuestion: false,
      screenWidth: window.innerWidth,
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    this.store.api.show = this.show
    // this.api.connect(["anonymous"]).then((session, connection)=>{
    //   session.subscribe('org.imod.public.message', this.api.handle_notification).then(()=>{
    //     console.log('subscribed to org.imod.public.message')
    //   })
    // });
    this.screenWidth = window.innerWidth
    const updateSize = (e)=>{
      this.screenWidth = e.width
    }
    this.store.event_bus.$on('resize',updateSize)
    this.api.contact = this.contact
  },
  methods: {
    contact(){
      this.showQuestion = true
    },
    show(info, duration) {
        this.snackbar_info = info
        this.snackbar_duration = duration || 3000
        this.showSnackbar = true
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.superscript {
  font-size: 16px;
  text-transform: none;
  vertical-align: super;
  color: #ff5253;
}
.subheader-title {
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
}
.menu-button {
  text-align: left;
}

.site-title {
  font-size: 30px;
  font-weight: 300;
}

@media screen and (max-width: 600px) {
  .site-title {
    font-size: 25px;
    font-weight: 250;
  }
}
@media screen and (max-width: 400px) {
  .site-title {
    font-size: 20px;
    font-weight: 220;
  }
}


#question-dialog{
  max-height: 1000px !important;
  max-width: 1200px !important;
  width: 80% !important;
  height: 60% !important;
}

@media screen and (max-width: 800px) {
  #question-dialog{
    max-height: 100% !important;
    max-width: 100% !important;
    width: 100% !important;
    height: 100% !important;
  }
}

#typeform-full{
  height:100%;
  width: 100%;
  position:absolute; left: 0; right: 0; bottom: 0; top: 0px;
}
</style>
