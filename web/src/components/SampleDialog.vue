<template>
  <md-dialog :md-active.sync="showDialog">
    <md-toolbar class="md-primary md-dense" md-elevation="0">
      <div class="md-toolbar-row"  flex>
          <div class="md-toolbar-section-start" >
            <h2>Upload a localization table</h2>
          </div>
          <div class="md-toolbar-section-end" >

            <md-button class="md-primary" @click="showDialog = false; submit_sample(sample)">OK</md-button>
            <md-button class="md-primary" @click="showDialog = false;submit_sample()">Cancel</md-button>
          </div>
        </div>
    </md-toolbar>
    <br>
    <!-- <md-dialog-title>{{title}}</md-dialog-title> -->
    <md-dialog-content>
        <viewer>
          <md-button slot="actions" slot-scope="actionsScope" class="md-primary" @click="actionsScope.$emit('share')">Upload</md-button>
        </viewer>
    </md-dialog-content>
    <!-- <md-dialog-actions>
      <md-button class="md-primary" @click="showDialog = false; submit_sample()">Cancel</md-button>
      <md-button class="md-primary" @click="showDialog = false; submit_sample(sample)">OK</md-button>
    </md-dialog-actions> -->
  </md-dialog>
</template>

<script>
import axios from 'axios';
import { saveAs } from 'file-saver';

export default {
  name: 'sample-dialog',
  props: ['title'],
  data () {
    return {
      hist_table: [],
      hist_options: {},
      loading_status: '',
      loading: false,
      loading_progress: 0,
      zipping: false,
      zipping_progress: 0,
      zipping_status: '',
      upload_enabled: false,
      uploading: false,
      upload_prgress: 0,
      tableUint8Arrays: null,
      tableArrays: null,
      metadata: {},
      sample: {},
      showDialog: false,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    this.api.showSampleDialog = this.showSampleDialog
  },
  methods: {
    showSampleDialog(sample) {
      this.sample = sample || {name: '', type: 'default'}
      this.showDialog = true
    },
    closeDialog() {
      this.showDialog = false
    },
    submit_sample(sample){
      this.$emit('input', sample)
      this.$emit('close', sample)
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.md-dialog {
  height:98%;
  width:98%;
  min-width:98%;
  min-height:98%;
}
</style>
