<template>
  <div class="password">
    <md-subheader> {{title}}</md-subheader>
    <md-button v-if="mode=='error'" class="md-primary" to='/'>Go Back Home</md-button>
    <md-card v-if="mode=='forget'">
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <form v-show="!status">
          <md-field>
            <label for="user-id">Email</label>
            <md-input v-model="email" type="text"></md-input>
          </md-field>
          <md-button class="md-primary"  :disabled="processing"  @click="forget_password()">Send Validation Email</md-button>
        </form>
        <h2 v-show="status">{{status}}</h2>
      </md-card-content>
    </md-card>
    <md-card v-if="mode=='reset'">
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <form v-show="!status">
          <md-field>
            <label for="user-passwd">New Password</label>
            <md-input v-model="passwd" type="password"></md-input>
          </md-field>
          <md-field v-if="passwd!=''">
            <label for="user-passwd-repeat">Repeat Password</label>
            <md-input v-model="passwd_repeat" type="password" :disabled="processing" @keyup.enter.native="reset_password()"></md-input>
            <span class="md-error" v-if="passwd != passwd_repeat">password does not match</span>
          </md-field>
          <md-button class="md-primary"  :disabled="processing" @click="reset_password()">Reset Password</md-button>
        </form>
        <h2 v-show="status">{{status}}</h2>
      </md-card-content>
    </md-card>
    <md-card v-if="mode=='set'">
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <form v-show="!status">
          <md-checkbox v-model="acceptTOC">I accept the <a>Terms of Service</a></md-checkbox><md-button class="md-primary" to="/tos" target="_blank"><md-icon>open_in_new</md-icon></md-button>
          <md-field>
            <label for="user-uid">User ID</label>
            <md-input v-model="uid" type="text"></md-input>
            <span class="md-helper-text" >please use 3~12 latin characters</span>
          </md-field>
          <br>
          <md-field>
            <label for="user-passwd">Password</label>
            <md-input v-model="passwd" type="password"></md-input>
          </md-field>
          <md-field v-if="passwd!=''">
            <label for="user-passwd-repeat">Repeat Password</label>
            <md-input v-model="passwd_repeat" type="password" :disabled="processing" @keyup.enter.native="reset_password()"></md-input>
            <span class="md-error" v-if="passwd != passwd_repeat">password does not match</span>
          </md-field>
          <md-button class="md-primary"  :disabled="processing || !acceptTOC" @click="reset_password()">Set Password</md-button>
        </form>
        <h2 v-show="status">{{status}}</h2>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
export default {
  name: 'password',
  props: ['action'],
  data () {
    return {
      mode: 'error',
      processing: false,
      email: '',
      status: null,
      passwd_repeat:'',
      passwd: '',
      uid: '',
      acceptTOC: false,
      title: 'Page not found',
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){

    if(this.$route.params.action=='forget' || this.action=='forget'){
      this.title="Forget Password"
      this.mode='forget'
    }
    else if(this.$route.params.action=='reset'|| this.action=='reset'){
      this.title="Reset Password"
      this.mode='reset'
    }
    else if(this.$route.params.action=='set'|| this.action=='set'){
      this.title="Set User ID and Password"
      this.mode='set'
    }
    else if(this.$route.params.action=='validation'|| this.action=='validation'){
      this.title="Validate Email"
      this.mode='validation'
    }
    else{
      this.title="Page not found"
      this.mode="error"
    }
    this.api.hideLogin()
  },
  methods: {
    validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
    },
    forget_password(){
      if(!this.validateEmail(this.email)){
        this.api.show('Please provide a valid email address.', 4000)
        return
      }
      this.api.connect(["anonymous"]).then((session, connection)=>{
        this.processing = true;
        this.store.session.call("org.imod.public.forget_password", [{'authid':this.email}], {}, {disclose_me: true}).then(()=>{
          this.processing = false;
          this.status = "We will soon send an email for you to reset your password, please check your email."
          this.api.show("Please check your email.")
        }).catch((reason)=>{
          this.processing = false;
          if(reason.error == 'org.imod.already_sent'){
            this.status = "You should have received an email, if not, please try again in a few minutes."
          }
          else{
            this.status = "Something went wrong, please contact us to reset your pasword."
            this.api.show("Something went wrong, please contact us to reset your pasword.")
          }
          console.error(reason)
        });
      })
    },
    reset_password(){
      if(this.passwd.length<6){
        this.api.show('Please provide a password longer than 6 letters', 3000)
        return
      }
      if(this.passwd_repeat != this.passwd){
        this.api.show('repeated password does not match.', 3000)
        return
      }
      const authid = this.$route.query.authid || this.store.authid
      const secret = autobahn.auth_cra.derive_key(this.passwd, "ANNA-PALM"+authid, 100, 16);
      this.processing = true;
      const user_info = {'authid':authid, 'token':this.$route.query.token, 'secret': secret}
      if(this.mode == 'set'){
        if(!this.uid || this.uid == ''){
          this.status = "Please provide a valid user id."
          this.api.show("Please provide a valid user id.")
          this.processing = false
          return
        }
        user_info['uid'] = this.uid
      }
      this.store.session.call("org.imod.public.reset_password", [user_info], {}, {disclose_me: true}).then(()=>{
        this.processing = false;
        this.status = "Your password has been updated sucessfully, please login with the new password."
        this.api.showLogin()
        this.api.show("please login with the new password.")
        this.router.push('/')
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
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
