<template>
  <div class="options">
    <!-- <md-subheader>Options</md-subheader> -->
    <md-subheader v-show="store.user_data && store.user_data.uid">User ID: {{store.user_data.uid}}</md-subheader>
    <password action="reset"></password>
    <!-- <md-card>
      <md-card-header>
       </md-card-header>
      <md-card-content>

      </md-card-content>
    </md-card> -->
  </div>
</template>

<script>
export default {
  name: 'options',
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
</style>
