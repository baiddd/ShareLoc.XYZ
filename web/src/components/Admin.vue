<template>
  <div class="admin">
    <md-dialog-confirm
  :md-active.sync="showUConfirm"
  md-title="Delete confirmation"
  md-content="Are you sure to remove this user?"
  md-confirm-text="Yes"
  md-cancel-text="Cancel"
  @md-cancel="showUConfirm=false"
  @md-confirm="showUConfirm=false; remove_user(_user_2_remove)" />
  <md-dialog-confirm
:md-active.sync="showFConfirm"
md-title="Delete confirmation"
md-content="Are you sure to remove this file?"
md-confirm-text="Yes"
md-cancel-text="Cancel"
@md-cancel="showFConfirm=false"
@md-confirm="showFConfirm=false; remove_file(_file_owner_2_remove, _file_2_remove)" />

<md-dialog-confirm
:md-active.sync="showWConfirm"
md-title="Delete confirmation"
md-content="Are you sure to remove this worker?"
md-confirm-text="Yes"
md-cancel-text="Cancel"
@md-cancel="showWConfirm=false"
@md-confirm="showWConfirm=false; remove_worker(_worker_2_remove)" />

<md-dialog-confirm
:md-active.sync="showSConfirm"
md-title="Delete confirmation"
md-content="Are you sure to remove this sample?"
md-confirm-text="Yes"
md-cancel-text="Cancel"
@md-cancel="showSConfirm=false"
@md-confirm="showSConfirm=false; remove_sample(_sample_2_remove)" />
    <md-subheader>Users</md-subheader>
    <md-card>
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <md-table>
          <md-table-toolbar>
            <md-button class="md-primary" @click="update_user_list"><md-icon class="md-primary">refresh</md-icon>Refresh</md-button>
          </md-table-toolbar>
          <md-table-row>
            <md-table-head>ID</md-table-head>
            <md-table-head>Date</md-table-head>
            <md-table-head>Email Pending</md-table-head>
            <md-table-head>Actions</md-table-head>
          </md-table-row>
          <md-table-row v-for="user in user_list" :key="user.authid">
            <md-table-cell>{{user.authid}}</md-table-cell>
            <md-table-cell>{{user.createdAt}}</md-table-cell>
            <md-table-cell>{{user.emails?user.emails.length:0}}</md-table-cell>
            <md-table-cell>
              <md-button class="md-primary" @click="_user_2_remove=user.authid; showUConfirm=true">delete</md-button>
              <md-button class="md-primary" @click="print(user)">print</md-button>
            </md-table-cell>
          </md-table-row>
        </md-table>
      </md-card-content>
    </md-card>
    <br>
    <md-subheader>Workers</md-subheader>
    <md-card>
      <md-card-header>

       </md-card-header>
      <md-card-content>
        <md-table>
          <md-table-toolbar>
            <md-button class="md-fab md-primary" @click="showAddWorker()">
             <md-icon>add</md-icon>
             <md-tooltip>Add a worker</md-tooltip>
           </md-button>
            <md-button class="md-primary" @click="update_worker_list"><md-icon class="md-primary">refresh</md-icon>Refresh</md-button>
          </md-table-toolbar>
          <md-table-row>
            <md-table-head>Owner</md-table-head>
            <md-table-head>Name</md-table-head>
            <md-table-head>Tags</md-table-head>
            <md-table-head>URI</md-table-head>
            <md-table-head>AuthID</md-table-head>
            <md-table-head>Secret</md-table-head>
            <md-table-head>Actions</md-table-head>
          </md-table-row>
          <md-table-row v-for="worker in worker_list" :key="worker._id.$oid">
            <md-table-cell>{{worker.owner}}</md-table-cell>
            <md-table-cell>{{worker.name}}</md-table-cell>
            <md-table-cell>
              <md-chips v-model="worker.tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>
           </md-table-cell>
           <md-table-cell>{{worker.uri}}</md-table-cell>
           <md-table-cell>{{worker.authid}}</md-table-cell>
           <md-table-cell>{{worker.secret}}</md-table-cell>
            <md-table-cell>
              <md-button class="md-primary" @click="_worker_2_remove=worker._id; showWConfirm=true">delete</md-button>
              <md-button class="md-primary" @click="print(worker)">print</md-button>
            </md-table-cell>
          </md-table-row>
        </md-table>
      </md-card-content>
    </md-card>
    <br>
    <md-subheader>Samples</md-subheader>
    <md-button class="md-primary" @click="clean_up_samples()">Clean up samples</md-button>
    <md-card>
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <md-table>
          <md-table-toolbar>
            <md-button class="md-primary" @click="update_sample_list"><md-icon class="md-primary">refresh</md-icon>Refresh</md-button>
          </md-table-toolbar>
          <md-table-row>
            <md-table-head>Owner</md-table-head>
            <md-table-head>Name</md-table-head>
            <md-table-head>Tags</md-table-head>
            <md-table-head>Actions</md-table-head>
          </md-table-row>
          <md-table-row v-for="sample in sample_list" :key="sample._id.$oid">
            <md-table-cell>{{sample.owner}}</md-table-cell>
            <md-table-cell>{{sample.name}}</md-table-cell>
            <md-table-cell>
              <md-chips v-model="sample.tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>
           </md-table-cell>
            <md-table-cell>
              <md-button class="md-primary" @click="_sample_2_remove=sample._id; showSConfirm=true">delete</md-button>
              <md-button class="md-primary" @click="print(sample)">print</md-button>
              <md-button class="md-primary" :href="hostname+'/#/view?sample='+sample.hash" target="_blank">open</md-button>
            </md-table-cell>
          </md-table-row>
        </md-table>
      </md-card-content>
    </md-card>
    <br>
    <md-subheader>Files</md-subheader>
    <md-button class="md-primary" @click="clean_up_files()">Clean up files</md-button>
    <md-card>
      <md-card-header>
       </md-card-header>
      <md-card-content>
        <md-table>
          <md-table-toolbar>
            <md-button class="md-primary" @click="update_file_list"><md-icon class="md-primary">refresh</md-icon>Refresh</md-button>
          </md-table-toolbar>
          <md-table-row>
            <md-table-head>Owner</md-table-head>
            <md-table-head>Name</md-table-head>
            <md-table-head>Bucket</md-table-head>
            <md-table-head>Tags</md-table-head>
            <md-table-head>Size</md-table-head>
            <md-table-head>Actions</md-table-head>
          </md-table-row>
          <md-table-row v-for="file in file_list" :key="file.key">
            <md-table-cell>{{file.owner}}</md-table-cell>
            <md-table-cell>{{file.name}}</md-table-cell>
            <md-table-cell>{{file.bucket}}</md-table-cell>
            <md-table-cell>
              <md-chips v-model="file.tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>
           </md-table-cell>
            <md-table-cell>{{file.size}}</md-table-cell>
            <md-table-cell>
              <md-button class="md-primary" @click="_file_2_remove=file.key; _file_owner_2_remove=file.owner; showFConfirm=true">delete</md-button>
              <md-button class="md-primary" @click="print(file)">print</md-button>
            </md-table-cell>
          </md-table-row>
        </md-table>
      </md-card-content>
    </md-card>
    <md-dialog :md-active.sync="open_worker_dialog">
      <md-dialog-title>Create a new worker</md-dialog-title>
      <md-dialog-content>
        <form>
          <md-field>
            <label for="worker-name">Name</label>
            <md-input v-model="worker_config.name" type="text"></md-input>
          </md-field>
          <md-field>
            <label for="worker-uri">URI</label>
            <md-input v-model="worker_config.uri" type="text"></md-input>
          </md-field>

            <label for="worker-tags">Tags</label>
            <md-chips v-model="worker_config.tags">
             <template slot="md-chip" slot-scope="{ chip }">
               {{ chip }}
             </template>
           </md-chips>

           <md-field>
             <label for="worker-description">Description</label>
             <md-input v-model="worker_config.description" type="text"></md-input>
           </md-field>

          <h2>authid: {{worker_config.authid}}</h2>
          <h2>secret: {{worker_config.secret}}</h2>

          <md-dialog-actions>
            <md-button class="md-primary" @click="open_worker_dialog = false">Cancel</md-button>
            <md-button class="md-primary" @click="open_worker_dialog = false; add_worker(worker_config)">OK</md-button>
          </md-dialog-actions>
        </form>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>
import { colourGenerator, animalGenerator, randId } from '../utils.js'
const WORKER_TEMPLATE = {
  authid: '',
  uri:'',
  name:'',
  status:'',
  tags:[],
  description: '',
  task_template: {
    name: '',
    inputs: [
      {
        tags: [],
        files: [],
      },
    ],
    outputs: [
      {
        files: [ {name:'output', type: 'image/png', url: ''} ],
      },
    ],
    config: {},
    tags: [],
    expiresIn: 120
  },
  task_schema: {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "title": "task",
    "properties": {
      "expiresIn": {
        "type": "number"
      },
      "config": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          }
        }
      },
      "inputs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "files":{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string" },
                  "type": {"type": "string" },
                  "url": {"type": "string"}
                }
              }
            }
          }
        }
      }
    }
  }
}
export default {
  name: 'admin',
  data () {
    return {
      user_list: [],
      file_list: [],
      worker_list: [],
      sample_list: [],
      showUConfirm: false,
      showFConfirm: false,
      showSConfirm: false,
      showWConfirm: false,
      _user_2_remove: '',
      _file_2_remove: '',
      _worker_2_remove: '',
      _sample_2_remove: '',
      _file_owner_2_remove: '',
      _worker_owner_2_remove: '',
      _sample_owner_2_remove: '',
      open_worker_dialog: false,
      task_template: {},
      task_schema: {},
      inputs_schema: {},
      outputs_template: {},
      worker_config: {},
      confirm_message: 'nothing to confirm',
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api,
      print: console.log,
      hostname: location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')
    }
  },
  mounted(){
    const update = ()=>{
      this.update_file_list()
      this.update_worker_list()
      this.update_sample_list()
      this.update_user_list()
    }
    if(this.store.signed_in){
      update()
    }
    else{
      this.store.event_bus.$on('signed_in', update)
    }
  },
  methods: {
    showAddWorker(){
      this.worker_config = WORKER_TEMPLATE
      this.worker_config.name = colourGenerator()+'_'+animalGenerator()
      this.worker_config.authid = randId()
      this.worker_config.tags = []
      this.worker_config.description = ''
      this.open_worker_dialog = true
    },
    add_worker(worker_config){
      this.store.session.call("org.imod.admin.workers.add_worker", [{tags: this.worker_config.tags, name: this.worker_config.name, authid: this.worker_config.authid, uri: this.worker_config.uri}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("worker added.")
        this.update_worker_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    update_user_list(){
      this.store.session.call("org.imod.admin.get_user_list", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("user list updated.")
        this.user_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    remove_user(authid){
      this.store.session.call("org.imod.admin.remove_user", [authid], {}, {disclose_me: true}).then((res)=>{
        this.api.show("user '"+authid+"' is removed.")
        this.update_user_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    update_file_list(){
      this.store.session.call("org.imod.admin.files.get_file_list", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("file list updated.")
        this.file_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    remove_file(owner, key){
      this.store.session.call("org.imod.admin.files.remove_file", [owner, key], {}, {disclose_me: true}).then((res)=>{
        this.api.show("file '"+key+"' is removed.")
        this.update_file_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    clean_up_files(){
      this.store.session.call("org.imod.admin.files.clean_files", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("files are cleaned.")
        this.update_file_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    update_worker_list(){
      this.store.session.call("org.imod.admin.workers.get_worker_list", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("worker list updated.")
        this.worker_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    remove_worker(_id){
      this.store.session.call("org.imod.admin.workers.remove_worker", [_id], {}, {disclose_me: true}).then((res)=>{
        this.api.show("worker '"+_id.$oid+"' is removed.")
        this.update_worker_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    update_sample_list(){
      this.store.session.call("org.imod.admin.samples.get_sample_list", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample list updated.")
        this.sample_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    remove_sample(_id){
      this.store.session.call("org.imod.admin.samples.remove_sample", [_id], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample '"+_id.$oid+"' is removed.")
        this.update_sample_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    clean_up_samples(){
      this.store.session.call("org.imod.admin.samples.clean_samples", [{}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("samples are cleaned.")
        this.update_sample_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },

  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
