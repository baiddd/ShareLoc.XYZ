<template>
    <md-content>
        <md-subheader>Samples</md-subheader>
        <md-table v-model="sample_list" md-model-id="_id.$oid" md-card>
          <md-table-toolbar slot="md-table-alternate-header">
            <div class="md-toolbar-section-start">
              <md-button class="md-fab md-primary" @click="open_sample_dialog=true">
               <md-icon>add</md-icon>
               <md-tooltip>Create a sample</md-tooltip>
             </md-button>
             <div class="md-title">create a sample</div>
            </div>
            <div class="md-toolbar-section-end">
              <md-button class="md-primary" @click="update_sample_list"><md-icon class="md-primary">refresh</md-icon></md-button>
              <md-button class="md-icon-button">
                <md-icon class="md-accent">delete</md-icon>
              </md-button>
            </div>
          </md-table-toolbar>
          <md-table-row slot="md-table-row" slot-scope="{ item }" @md-selected=""  md-selectable="single">
            <!-- <md-table-cell md-label="Name"><md-checkbox v-model="item.select"></md-checkbox></md-table-cell> -->
            <md-table-cell md-label="Name" md-sort-by="name">{{item.name}}</md-table-cell>
            <md-table-cell md-label="Files">{{Object.keys(item.files).length}}</md-table-cell>
            <md-table-cell md-label="Tags">
              <md-chips v-model="item.tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
              </md-chips>
           </md-table-cell>
            <md-table-cell md-label="Actions">
              <md-button class="md-primary" @click="onSelectSample(item)">
               <md-icon>eye</md-icon>show files
               <md-tooltip>show files</md-tooltip>
              </md-button>
              <md-button class="md-primary" @click="selected_sample=null; api.showSampleDialog()">
               <md-icon>add</md-icon>Add file
               <md-tooltip>Add a file</md-tooltip>
              </md-button>

              <md-menu md-size="medium">
              <md-button  class="md-primary md-icon-button" md-menu-trigger><md-icon>more_horiz</md-icon></md-button>
              <md-menu-content>
                <md-menu-item>
                  <md-button class="md-primary" @click="remove_sample(item._id)"><md-icon>trash</md-icon>delete</md-button>
                </md-menu-item>
              </md-menu-content>
             </md-menu>
            </md-table-cell>
          </md-table-row>
      </md-table>
      <br>
      <files></files>
      <md-dialog :md-active.sync="open_sample_dialog">
        <md-dialog-title>Create a new sample</md-dialog-title>
        <md-dialog-content>
          <form>
            <md-field>
              <label for="sample-name">Name</label>
              <md-input v-model="sample_name" type="text"></md-input>
            </md-field>

              <label for="sample-tags">Tags</label>
              <md-chips v-model="sample_tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>


            <md-dialog-actions>
              <md-button class="md-primary" @click="open_sample_dialog = false">Cancel</md-button>
              <md-button class="md-primary" @click="open_sample_dialog = false; add_sample()">OK</md-button>
            </md-dialog-actions>
          </form>
        </md-dialog-content>
      </md-dialog>
      <md-dialog :md-active.sync="showSamples">
        <md-subheader v-show="selected_sample">Samples</md-subheader>
        <md-table v-if="selected_sample" v-model="sample_list" md-model-id="_id.$oid"  md-card>
          <md-table-toolbar slot="md-table-alternate-header">
            <!-- <div class="md-toolbar-section-start">
              <md-button class="md-fab md-primary" @click="selected_sample=null; api.showSampleDialog()">
               <md-icon>add</md-icon>
               <md-tooltip>Add a sample</md-tooltip>
             </md-button>
             <div class="md-title">add a sample</div>
            </div> -->
            <div class="md-toolbar-section-end">
              <md-button class="md-primary" @click="update_sample_list"><md-icon class="md-primary">refresh</md-icon></md-button>
              <md-button class="md-icon-button">
                <md-icon class="md-accent">delete</md-icon>
              </md-button>
            </div>
          </md-table-toolbar>
          <md-table-row slot="md-table-row" slot-scope="{ item }" @md-selected="onSelectSample" md-selectable="single">
            <md-table-cell md-label="Name">{{item.name}}</md-table-cell>
            <md-table-cell md-label="Samples">{{item.samples.length}}</md-table-cell>
            <md-table-cell md-label="Actions">
              <md-menu md-size="medium">
              <md-button  class="md-primary md-icon-button" md-menu-trigger><md-icon>more_horiz</md-icon></md-button>
              <md-menu-content>
                <md-menu-item>
                  <md-button class="md-primary" @click="remove_sample(item._id)"><md-icon>trash</md-icon>delete</md-button>
                </md-menu-item>
                <md-menu-item>
                  <md-button class="md-primary" @click="rename_sample(item._id)"> <md-icon>pen</md-icon>rename</md-button>
                </md-menu-item>
              </md-menu-content>
             </md-menu>

            </md-table-cell>
          </md-table-row>
        </md-table>
      </md-dialog>
      <sample-dialog title="Sample" v-on:close="sample_callback"> </sample-dialog>
  </md-content>

</template>

<script>

import axios from 'axios';
export default {
  name: 'samples',
  data () {
    return {
      selected_file_name: "",
      file_list: [],
      sample_list: [],
      sample_name: '',
      sample_tags: [],
      sample_type: '',
      showSamples: false,
      selected_sample: null,
      mode: 'upload',
      open_sample_dialog: false,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api,
      sample_callback: this.edit_sample,
    }
  },
  mounted(){
    const update = ()=>{
      this.update_sample_list()
    }
    if(this.store.signed_in){
      update()
    }
    else{
      this.store.event_bus.$on('signed_in', update)
      this.api.showLogin()
    }
  },
  methods: {
    onSelectSample(item){
      this.selected_sample = item
      console.log(item)
    },
    onSelectSample(item){
      this.selected_sample = item || this.selected_sample
      this.api.showSampleDialog(this.selected_sample)
      console.log(this.selected_sample)
    },
    selectFile(){
      this.upload_prgress = 0
      this.$refs.select_file_input.click()
    },
    edit_sample(sample){
      if(!sample) return

      if(!this.selected_sample){
        this.api.show("no sample is selected.")
        return
      }
      let new_sample = {'samples': [this.selected_sample._id], 'name': sample.name, 'type': sample.type}
      // this.store.session.call("org.imod.user.samples.update_sample", [new_sample], {}, {disclose_me: true}).then((res)=>{
      //   this.api.show("sample added.")
      //   this.update_sample_list()
      // }).catch((err)=>{
      //   console.log(err)
      //   this.api.show(err)
      // })
      console.log('edit sample')
    },
    add_sample(){
      this.store.session.call("org.imod.user.samples.add_sample", [{'name': this.sample_name, 'tags': this.sample_tags}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample added.")
      }).catch((err)=>{
        console.log(err)
        this.api.show(err, 5000)
      })
    },
    update_sample_list(){
      this.store.session.call("org.imod.user.samples.get_sample_list", [{'owner': this.store.authid}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample list updated.")
        this.sample_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err, 5000)
      })
    },
    update_file_list(){
      this.store.session.call("org.imod.user.files.get_file_list", [{'owner': this.store.authid}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("data list updated.")
        this.file_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err, 5000)
      })
    },
    remove_file(key){
      this.store.session.call("org.imod.user.files.remove_file", [key], {}, {disclose_me: true}).then((res)=>{
        this.api.show("file '"+key+"' is removed.")
        this.update_file_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err, 5000)
      })
    },
    remove_sample(_id){
      this.store.session.call("org.imod.user.samples.remove_sample", [_id], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample '"+_id+"' is removed.")
        this.update_sample_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err, 5000)
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  /* @media screen and (max-width: 1024px) {
      .md-dialog{
        max-height: 98% !important;
        max-width: 97% !important;
        width: 97% !important;
      }
  }
  @media screen and (min-width: 1024px) {
    .md-dialog{
      max-height: 98% !important;
      max-width: 97% !important;
      min-width: 1024px!important;
    }
  } */
  /* .icon-accent{
    color: #de3657;
  }
  .icon-primary{
    color: #448aff;
  } */
</style>
