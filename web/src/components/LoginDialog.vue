<template>
  <div>
  <md-dialog :md-active.sync="showDialog">
    <md-dialog-content>
    <md-tabs class="md-transparent" md-sync-route ref="tabs">
      <md-tab id="login-tab" md-label="Login">
          <form>
            <md-field>
              <label for="user-id">Email</label>
              <md-input v-model="authid" type="text"></md-input>
            </md-field>
            <md-field>
              <label for="user-passwd">Password</label>
              <md-input v-model="passwd" type="password" @keyup.enter.native="login_signup()"></md-input>
              <span class="md-helper-text clickable-helper"  @click="showDialog=false; showForgetDialog=true">forget password</span>
            </md-field>
          </form>

      </md-tab>
      <md-tab id="signup-tab" md-label="Signup">
        <form>
          <md-field>
            <label for="user-id">Email</label>
            <md-input v-model="authid" :disabled="signed_up" type="text" @keyup.enter.native="login_signup()"></md-input>
          </md-field>
          <!-- <md-field>
            <label for="user-passwd">Password</label>
            <md-input v-model="passwd" type="password"></md-input>
          </md-field>
          <md-field v-if="passwd!=''">
            <label for="user-passwd-repeat">Repeat Password</label>
            <md-input v-model="passwd_repeat" type="password"  @keyup.enter.native="login_signup()"></md-input>
            <span class="md-error" v-if="passwd != passwd_repeat">password does not match</span>
          </md-field> -->
        </form>
      </md-tab>
    </md-tabs>
    <p v-show="status">{{status}}</p>
    <p>  <md-button @click="api.contact" id="help-button"> Can't sign up/login?</md-button></p>
  </md-dialog-content>
  <md-dialog-actions>
    <md-button class="md-primary" :disabled="processing" @click="login_signup()">OK</md-button>
    <md-button class="md-primary" @click="closeDialog()">Cancel</md-button>
  </md-dialog-actions>
  </md-dialog>
  <md-dialog :md-active.sync="showForgetDialog">
    <md-dialog-content>
      <password action="forget"/>
    </md-dialog-content>
    <md-dialog-actions>
      <md-button class="md-primary" @click="showForgetDialog=false">Exit</md-button>
    </md-dialog-actions>
  </md-dialog>

 </div>
</template>

<script>
export default {
  name: 'login-dialog',
  props: ['label'],
  data () {
    return {
      processing: false,
      mode: "login",
      authid: "",
      signed_up: false,
      passwd: "",
      passwd_repeat: "",
      status: null,
      showDialog: false,
      showForgetDialog: false,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    this.api.connect = this.connect
    this.api.login = this.login
    this.api.logout = this.logout
    this.api.showLogin = this.showLogin
    this.api.hideLogin = this.hideLogin
    this.api.handle_notification = this.handle_notification
  },
  methods: {
    login_signup(){
      this.status = null
      console.log()
      if(this.$refs.tabs.activeTab == "login-tab"){
        this.login("wampcra")
      }
      else if(this.$refs.tabs.activeTab == "signup-tab"){
        this.signup()
      }
      else{
        console.error("error mode.")
      }

    },
    validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
    },
    signup() {
      console.log('signup')
      //if(this.connection)
      //  this.connection.close("wamp.close.logout");
      this.connect(["anonymous"]).then((session, connection)=>{
        if(!this.validateEmail(this.authid)){
          this.api.show('Please provide a valid email address.', 4000)
          return
        }
        // if(this.passwd_repeat != this.passwd){
        //   this.api.show('repeated password does not match.', 3000)
        //   return
        // }
        // const secret = autobahn.auth_cra.derive_key(this.passwd, "shareLoc.xyz"+this.authid, 100, 16);
        const secret = null;
        this.processing = true;
        const timer = setTimeout(()=>{
          this.processing = false;
           this.status= "Something went wrong, please try agian."
           this.api.show("Connection timeout, please try again.")
           console.error("Connection timeout, please try again.")
        },5000);
        session.call("org.imod.public.signup", [{'authid':this.authid, 'secret':secret, 'webapp': 'shareloc.xyz'}], {}, {disclose_me: true}).then(()=>{
          clearTimeout(timer);
          this.processing = false
          // this.authid= ''
          this.api.show("Please check your email:'"+this.authid+"'.", 5000)
          this.status= "You will soon receive an email with a link to set your password. If you do not receive the email, please check your spam or bulk email folder."
          this.signed_up = true
          //this.closeDialog('login_dialog')
        }).catch((reason)=>{
          this.processing = false
          clearTimeout(timer);
           this.status="Error: " + reason.args[0]
            if(reason.args){
              this.api.show(reason.args[0], 5000)
            }
            else{
              this.api.show(reason)
            }
        });
        session.subscribe('org.imod.public.message', this.handle_notification)
      });
    },
    handle_notification(args, kwargs, details){
      console.log(details)
    },
    login(authmethod) {
      return new Promise((resolve, reject) => {
        console.log('try to login with ', authmethod)
        // try {
        //   this.store.connection.close("wamp.close.logout");
        // } catch (e) {
        //
        // }
        this.processing = true;
        const timer = setTimeout(()=>{
          this.processing = false;
           if(authmethod == 'wampcra'){
             this.status= "Something went wrong, please check your email and password."
             this.api.show("Connection timeout, please try again.")
             console.error("Connection timeout, please try again.")
             reject()
           }
        },5000);

        this.connect([authmethod], this.authid, this.passwd).then((session)=>{
          clearTimeout(timer);
          this.processing = false;
          //this.$set(this.store, 'signed_in', true)
          // if(this.store.authrole == 'anonymous'){
          //   this.logout()
          //   return
          // }
          console.log('connected with', this.store.authrole)
          if(this.store.authrole != 'anonymous'){
            this.store.session.call("org.imod.user.get_user_data", [null], {}, {disclose_me: true}).then((res)=>{
              this.processing = false;
              if(res) {
                this.store.user_data = res
                this.store.uid = res.uid
              }
              this.closeDialog('login_dialog')
              this.api.show("You are now logged in as "+ this.store.authid)
              this.store.signed_in = true
              session.subscribe('org.imod.user.'+this.store.authid , this.handle_notification).catch((err)=>{console.error(err)})
              this.store.event_bus.$emit('signed_in', this.store.authid)
              resolve()
            }).catch((reason)=>{
              this.processing = false;
              if(reason.error){
                this.status = "Error: " + reason.args[0]
                this.api.show( "Error: " + reason.args[0])
              }
              else{
                this.status = "Something went wrong, please contact us to reset your pasword."
                this.api.show("Something went wrong, please contact us to reset your pasword.")
              }
              console.error(reason)
              reject()
            });
          }
          session.subscribe('org.imod.public.message', this.handle_notification).catch((err)=>{console.error(err)})

        }).catch(()=>{this.processing = false;
          console.log('connection failed with ', authmethod)
          reject()

        })
      })
    },
    showLogin() {
      this.passwd = ''
      this.status = null
      this.showDialog = true
    },
    hideLogin() {
      this.showDialog = false
    },
    closeDialog() {
      this.status = null
      this.showDialog = false
    },
    logout(){
      this.store.connection.close("wamp.close.logout");
    },
    connect(authmethods, authid, passwd){
      authmethods = authmethods ||  ["anonymous"];
      return new Promise((resolve, reject) => {
        let secret = "";
        const connection = new autobahn.Connection({
           url: "wss://dai.pasteur.fr/ws",
           realm: 'realm1',
           authmethods: authmethods,
           authid: authid,
           onchallenge(session, method, extra) {
             console.log(method)
            if (method === "wampcra") {
              console.log("onchallenge: authenticating via '" + method + "' and challenge '" + extra.challenge + "'");
              return autobahn.auth_cra.sign(secret, extra.challenge);
            }
           },
           on_user_error(error, error_message){
             reject()
             this.api.show(error_message);
             console.error(error)
           }
        });

        if(authid && passwd){
          secret = autobahn.auth_cra.derive_key(passwd, "ANNA-PALM"+authid, 100, 16);
        }
        connection.onopen = (session, details) => {
          // if(details.authmethod != 'wampcra' && details.authmethod != 'cookie' && details.authmethod != 'anonymous' ){
          //   this.logout()
          //   reject()
          //   return
          // }
          this.store.session = session
          this.store.connection = connection
          this.store.authid = details.authid
          this.store.authrole = details.authrole
          this.store.connected = true
          console.log("connected: ", details.authid, details.authrole)
          resolve(session, connection)
          this.store.event_bus.$emit('connected', this.store.authid)
        };
        connection.onclose = (reason) =>{
          this.store.session = null
          this.store.connection = null
          this.store.authid = null
          this.store.uid = null
          this.store.authrole = null
          this.store.signed_in = false
          this.store.connected = false
          if(this.store.signed_in) this.api.show("logged out")
          this.processing = false
          reject()
        }
        connection.open();
      })
    },
    disconnect(){

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.clickable-helper:hover {
    cursor: pointer;
}
#help-button{
  text-transform: none;
}
</style>
