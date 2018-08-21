<template>
  <div class="repository">

    <md-subheader v-if="title">{{title}}</md-subheader>
    <md-divider v-if="title"></md-divider>

    <md-toolbar v-if="showTags" class="md-transparent md-dense" md-elevation="0">
      <p>Tag filter:</p>
      <md-chip @click="filter_tag(); selected_tag='all'" :class="selected_tag=='all'?'md-primary':''" md-static md-clickable>
        all
      </md-chip>
      <md-chip  v-for="tagO in tag_list" :class="selected_tag==tagO._id?'md-primary':''" :key="tagO._id" @click="filter_tag(tagO._id); selected_tag=tagO._id;" md-static md-clickable>
        {{tagO._id}}<md-tooltip>{{tagO.count}} samples</md-tooltip>
      </md-chip>
       <!-- <md-divider></md-divider> -->
    </md-toolbar>
    <md-toolbar class="md-transparent md-dense" md-elevation="0"  v-if="title">
        <p>Reminder: except where otherwise noted, public data on this site is licensed under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons Attribution 4.0 International license.</a> </p>
    </md-toolbar>
    <div class="md-layout md-gutter md-alignment-top-center">
      <md-empty-state
       v-if="!loading_public_samples && public_sample_list.length <= 0"
       md-icon="info_outline"
       md-label="No sample available on this page."
       md-description="">

     </md-empty-state>

      <md-card class="sample-card" v-for="sample in public_sample_list" :key="sample._id.$oid">
          <md-card-media  md-ratio="16:9">
            <a target="_blank" :href="url_prefix + sample.public_uuid">
            <img class="thumbnail-img"  :src="sample.thumbnail"  :alt="sample.name">
            </a>
          </md-card-media>
          <md-card-area>
            <md-card-header>
              <md-chips class="tags-chip" v-model="sample.tags" md-static>
               <template slot="md-chip" slot-scope="{ chip }">
                 {{ chip }}
               </template>
             </md-chips>
            </md-card-header>
            <md-card-actions>
              <span class="md-title">#{{sample.hash | truncate(12)}}</span>
              <md-button :href="url_prefix + sample.public_uuid" target="_blank">Open</md-button>
              <md-button class="md-primary md-icon-button" @click="selected_sample=sample; showInfoDialog=true"><md-icon>more_horiz</md-icon></md-button>

            </md-card-actions>
          </md-card-area>

      </md-card>
      <br>
      </div>
      <div v-if="loading_public_samples" class="md-layout md-alignment-center-center">
          <md-progress-spinner :md-diameter="100" :md-stroke="10" md-mode="indeterminate"></md-progress-spinner>
      </div>
      <br>
      <md-toolbar class="md-transparent md-dense md-layout-item" md-elevation="0">
        <div class="md-toolbar-row md-layout md-gutter md-alignment-top-center" flex>
          <md-button @click="prev_page" class="md-primary" :disabled="page_no==0">Previous Page</md-button>
          <md-button class="md-primary" :disabled="public_sample_list.length==0" @click="next_page">Next Page</md-button>
        </div>
      </md-toolbar>
    <md-dialog :md-active.sync="showInfoDialog">
      <md-dialog-content>
        <div class="md-layout-row md-gutter">
          <div class="md-flex" v-if="selected_sample">
            <p>Name: {{selected_sample.name}}</p>
            <p>Description: {{selected_sample.description}} </p>
            <p>Owner: {{selected_sample.owner}}</p>
            <p>UserID: {{selected_sample.uid}}</p>
            <p>Cite as: {{selected_sample.citeAs}}</p>
            <p>Tags:</p>
            <md-chips v-model="selected_sample.tags" md-static>
             <template slot="md-chip" slot-scope="{ chip }">
               {{ chip }}
             </template>
           </md-chips>
           <br>
           <md-divider></md-divider>

           <span class="md-list-item-text">Files (click to download)</span>
           <md-list v-if="selected_sample.files">
               <md-list-item class="md-primary" @click="downloadFile(selected_sample, f)" v-for="(f, h) in selected_sample.files" :key="h">
                 <md-chip v-for="tag in f.tags" :key="tag">{{tag}}</md-chip>{{f.name}}</span>
               </md-list-item>
           </md-list>
          </div>

        </div>
    </md-dialog-content>
    <md-dialog-actions>
      <md-button v-if="store.authrole=='admin'" class="md-primary" @click="showInfoDialog=false;showRemoveConfirm=true">Remove Plublic Sample</md-button>
      <md-button class="md-primary" @click="showInfoDialog=false">OK</md-button>
      <md-button class="md-primary" @click="showInfoDialog=false">Cancel</md-button>
    </md-dialog-actions>
    </md-dialog>
    <md-dialog-confirm
    v-if="store.authrole=='admin'"
    :md-active.sync="showRemoveConfirm"
    md-title="Delete confirmation"
    md-content="Are you sure to remove this sample?"
    md-confirm-text="Yes"
    md-cancel-text="Cancel"
    @md-cancel="showSConfirm=false"
    @md-confirm="showSConfirm=false; remove_sample(selected_sample._id)" />
    <br>
    <br>
    <md-divider v-if="title"></md-divider>
    <main-footer v-if="title"/>
  </div>
</template>

<script>
export default {
  name: 'repository',
  props: {
    title: {
      type: String,
      default: 'Repository'
    },
    showTags: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      selected_tag: 'all',
      last_sample_filter: null,
      sample_filter: {'tags': {'$nin': ['deprecated']}},
      tag_list: [],
      selected_sample: null,
      showInfoDialog: false,
      showRemoveConfirm: false,
      loading_public_samples: false,
      public_sample_list: [],
      url_prefix: '',
      page_no: 0,
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    const hostname = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '');
    this.url_prefix = hostname + '/#/view?u='
    if(this.store.connected){
      this.update_tag_list()
      this.update_public_sample_list()
    }
    else{
      this.store.event_bus.$on('connected', this.update_public_sample_list)
      this.store.event_bus.$on('connected', this.update_tag_list)
    }

  },
  methods: {
    downloadFile(sample, f){
      const sample_query = {}
      if(sample.public && sample.public_uuid){
        sample_query.public_uuid = sample.public_uuid
      }
      else{
        sample_query.hash = sample.hash
        sample_query.shared_token = sample.shared_token
      }
      this.store.session.call('org.imod.public.get_shared_sample_file', [sample_query, f.hash], {}, {disclose_me: true}).then((ret)=>{
        console.log('file url', ret.url)
        const element = document.createElement('a');
        let filename = sample.name
        if(!filename.endsWith('.smlm') && !filename.endsWith('.zip')){
          filename = filename + '.smlm'
        }
        element.setAttribute('href', ret.url);
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      }).catch((reason)=>{
        console.error(reason)
        this.api.show(reason.args[0])
        reject(reason)
      })
    },
    filter_tag(tag){
      if(tag){
        this.sample_filter = {'tags': tag}
      }
      else{
        this.sample_filter = {'tags': {'$nin': ['deprecated']}}
      }
      this.update_public_sample_list()
    },
    prev_page(){
      if(this.page_no==0) return
      else{
        this.page_no = this.page_no - 1
      }
      this.$router.push({
        path: '/repository',
        query: {'page': this.page_no}
      })
      this.update_public_sample_list()
    },
    next_page(){
      this.page_no = this.page_no + 1
      this.$router.push({
        path: '/repository',
        query: {'page': this.page_no}
      })
      this.update_public_sample_list()
    },
    update_tag_list(){
      console.log('updating tags')
      this.available_tags = []
      this.store.session.call("org.imod.public.get_tag_list", [{'public': true}], {}, {disclose_me: true}).then((tag_list)=>{
        this.api.show("tag list updated.")
        this.tag_list = tag_list
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    },
    update_public_sample_list(){
      console.log(this.$route.query)
      // if(last_sample_filter == this.sample_filter && this.$route.query.page && this.page_no == parseInt(this.$route.query.page)){
      //   return
      // }
      if(this.$route.query.page){
        this.page_no = parseInt(this.$route.query.page)
      }
      if(!this.loading_public_samples){
        this.loading_public_samples=true
        this.public_sample_list = []
        this.store.session.call("org.imod.public.get_sample_list", [this.sample_filter, this.page_no], {}, {disclose_me: true, receive_progress: true}).then(()=>{
          this.last_sample_filter = this.sample_filter
          this.loading_public_samples=false
          this.api.show("public sample list updated.")
        }, ()=>{
          console.log(err)
          this.api.show(err)
          this.loading_public_samples=false
        }, (res)=>{
          this.public_sample_list.push(res)
        }).catch((err)=>{

        })
      }


    },
    remove_sample(_id){
      this.store.session.call("org.imod.admin.samples.remove_sample", [_id], {}, {disclose_me: true}).then((res)=>{
        this.api.show("sample '"+_id.$oid+"' is removed.")
        this.update_public_sample_list()
      }).catch((err)=>{
        console.log(err)
        this.api.show(err)
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.repository{
  overflow-x:hidden;
}

.thumbnail-img{
   border: 1px solid #ddd; /* Gray border */
   border-radius: 4px;  /* Rounded border */
   padding: 0px; /* Some padding */
   margin-right: 10px;
   /* width: 256px;    Set a small width */
}

/* Add a hover effect (blue shadow) */
img.thumbnail-img:hover {
    box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);
}

.sample-card {
    width: 350px;
    margin: 6px;
    display: inline-block;
    vertical-align: top;
}

@media screen and (max-width: 800px) {
  .sample-card {
      width: 100%;
      margin: 1px;
      display: inline-block;
      vertical-align: top;
  }
}

.md-chips.md-field.tags-chip{
  flex-wrap: nowrap;
  overflow: hidden;
}
</style>
