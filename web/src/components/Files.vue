<template>
    <md-content>
      <md-card v-show="uploading">
        <md-card-header>
          <md-subheader>Uploading</md-subheader>
        </md-card-header>
        <md-card-content>
          <form>
            <div class="md-layout" md-align="begin">
                <p>Uploading: {{selected_file_name}}</p>
            </div>
            <div class="md-layout"  md-vertical-align="end" v-show="false">
              <input class="md-file" type="file" @change="fileSelected" ref="select_file_input"></input>
            </div>
          </form>
          <div layout="row" v-if="uploading">
            <md-progress-bar :md-value="upload_prgress"></md-progress-bar>
            <p>{{uploading?'please wait, this may take a while.': ''}} </p>
          </div>
        </md-card-content>
      </md-card>
      <br v-show="uploading">
      <md-subheader>Files</md-subheader>
        <md-table md-card>
          <md-table-toolbar slot="md-table-alternate-header">
            <div class="md-toolbar-section-start">
              <!-- <md-button class="md-fab md-primary" @click="selectFile" :disabled="uploading">
               <md-icon>add</md-icon>
               <md-tooltip>Upload a File</md-tooltip>
             </md-button> -->
              <md-button class="md-primary" @click="update_file_list"><md-icon class="md-primary">refresh</md-icon>Refresh</md-button>
            </div>
            <div class="md-toolbar-section-end">
              <md-button class="md-icon-button">
                <md-icon class="md-accent">delete</md-icon>
              </md-button>
            </div>

          </md-table-toolbar>
          <md-table-row>
            <md-table-head class="table-head-checkbox"><md-checkbox class="table-head-checkbox" >Select all</md-checkbox></md-table-head>
            <md-table-head>Name</md-table-head>
            <md-table-head>Tags</md-table-head>
            <md-table-head>Size</md-table-head>
            <md-table-head>Actions</md-table-head>
          </md-table-row>
          <md-table-row v-for="file in file_list" :key="file.key">
            <md-table-cell><md-checkbox v-model="file.select"></md-checkbox></md-table-cell>
            <md-table-cell>{{file.name}}</md-table-cell>
            <md-table-cell>
              <md-chips v-model="file.tags">
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>
           </md-table-cell>
            <md-table-cell>{{file.size}}</md-table-cell>
            <md-table-cell>
              <md-menu md-size="medium">
              <md-button  class="md-primary md-icon-button" md-menu-trigger><md-icon>more_horiz</md-icon></md-button>
              <md-menu-content>
                <md-menu-item>
                  <md-button class="md-primary" @click="remove_file(file.key)"><md-icon>trash</md-icon>delete</md-button>
                </md-menu-item>
                <md-menu-item>
                  <md-button class="md-primary" @click="rename_file(file.key)"> <md-icon>pen</md-icon>rename</md-button>
                </md-menu-item>
              </md-menu-content>
             </md-menu>

            </md-table-cell>
          </md-table-row>
      </md-table>
   </md-content>

</template>

<script>

import axios from 'axios';
export default {
  name: 'files',
  data () {
    return {
      selected_file_name: "",
      uploading: false,
      upload_prgress: 0,
      showDialog: false,
      file_list: [],
      // sample_list: [],
      // dataset_list: [],
      // dataset_name: '',
      // dataset_type: '',
      // sample_type: '',
      // sample_name: '',
      // selected_dataset: null,
      // selected_sample: null,
      mode: 'upload',
      // open_dataset_dialog: false,
      // open_sample_dialog: false,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api,
    }
  },
  mounted(){
    const update = ()=>{
      this.update_file_list()
    }
    if(this.store.signed_in){
      update()
    }
    else{
      this.store.event_bus.$on('signed_in', update)
    }
  },
  methods: {
    fileSelected(e){
      const files = e.target.files
      console.log('file selected', files)
      if (files && files.length>0){
        if(files.length==1){
          this.selected_file_name = files[0].name
        }
        else{
          this.selected_file_name = files[0].name + ", " + files[1].name + " etc."
        }
        console.log(files)
        this.upload(files[0])
        // for(var i=0;i<files.length;i++){
        //   this.upload(files[i])
        // }
      }
    },
    // onSelectDataset(item){
    //   this.selected_dataset = item
    //   this.update_sample_list()
    //   console.log(item)
    // },
    // onSelectSample(item){
    //   this.selected_sample = item
    //   console.log(item)
    // },
    selectFile(){
      this.upload_prgress = 0
      this.$refs.select_file_input.click()
    },
    // add_sample(){
    //   this.store.session.call("org.imod.user.datasets.add_sample", [{'datasets': [this.selected_dataset._id], 'name': this.sample_name, 'type': this.sample_type}], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("sample list updated.")
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    // update_sample_list(){
    //   this.store.session.call("org.imod.user.datasets.get_sample_list", [this.selected_dataset._id], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("sample list updated.")
    //     this.sample_list = res
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    // add_dataset(){
    //   this.store.session.call("org.imod.user.datasets.add_dataset", [{'name': this.dataset_name, 'type': this.dataset_type}], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("dataset list updated.")
    //     this.dataset_list = res
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    // update_dataset_list(){
    //   this.store.session.call("org.imod.user.datasets.get_dataset_list", [{'owner': this.store.authid}], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("dataset list updated.")
    //     this.dataset_list = res
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    update_file_list(){
      this.store.session.call("org.imod.user.files.get_file_list", [{'owner': this.store.authid}], {}, {disclose_me: true}).then((res)=>{
        this.api.show("data list updated.")
        this.file_list = res
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    remove_file(key){
      this.store.session.call("org.imod.user.files.remove_file", [key], {}, {disclose_me: true}).then((res)=>{
        this.api.show("file '"+key+"' is removed.")
        this.update_file_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    // remove_dataset(_id){
    //   this.store.session.call("org.imod.user.datasets.remove_dataset", [_id], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("dataset '"+_id+"' is removed.")
    //     this.update_dataset_list()
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    // remove_sample(_id){
    //   this.store.session.call("org.imod.user.datasets.remove_sample", [_id], {}, {disclose_me: true}).then((res)=>{
    //     this.api.show("sample '"+_id+"' is removed.")
    //     this.update_sample_list()
    //     // this.update_dataset_list()
    //   }).catch((err)=>{
    //     console.log(err)
    //     this.api.show(err)
    //   })
    // },
    upload(file) {
      console.log(file)
      this.store.session.call("org.imod.user.files.get_upload_url", [{name:file.name, type:file.type, size:file.size}], {}, {disclose_me: true}).then((res)=>{
        var signedUrl = res.url;
        var fileKey = res.key;
        var options = {
          headers: {
            'Content-Type': file.type
          },
          onUploadProgress: (progressEvent) => {
            this.upload_prgress = 1.0 * progressEvent.loaded / file.size * 100.0
          }
        };
        this.uploading = true
        console.log(signedUrl);
        axios.put(signedUrl, file, options).then((result) => {
          this.uploading = false
          console.log('data uploaded, finishing')
          this.store.session.call("org.imod.user.files.finish_upload", [fileKey, {name:file.name, type:file.type, size:file.size}], {}, {disclose_me: true}).then((res2)=>{
            this.selected_file_name = ""
            this.update_file_list()
            this.$forceUpdate()
            this.api.show("data uploaded.", 2000)
            console.log('finished data upload')

          }).catch((err)=>{
            console.error(err)
            this.api.show("upload failed, please try again.", 5000)
          })
        }).catch((err) => {
          console.error(err)
          this.api.show("upload failed, please check your s3 configuration.", 5000)
          this.uploading = false
        });

      }).catch((reason)=>{

          if(reason.args){
            this.api.show(reason.args[0])
          }
          else{
            this.api.show(reason)
          }
      });
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
