<template>
  <div class="tos">
    <!-- <md-subheader>Options</md-subheader> -->
    <md-subheader>Terms of service</md-subheader>
    <md-card>
      <md-card-content>
        <p>By accessing the website at <a href="https://shareloc.xyz">https://shareloc.xyz</a>, you agree to be bound by <a href="https://www.pasteur.fr/fr/mentions-legales" target="_blank"> LEGAL NOTICE </a> and additional terms specified below, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
        <p>1. Data uploaded to the website can only be accessed by the user who uploaded the data, except for cases specified below. </p>
        <p>2. By requesting a shared link on the website, the user agrees to give access to anyone holding the shared link. The shared link will not be displayed, shared or spread by the website, but the user is responsible for keeping the url safely and sharing it only as intended.</p>
        <p>3. If a user publishes data on the website, a permanent public url will be generated to link with the data. Once generated, the public url can be announced on the website or sent to other users with notifications by the website. The user will not be able to remove the data or the url from the website. However, the user can tag the data as 'deprecated'. We reserve the right to refuse requests to remove published data.</p>
        <p>4. Except where otherwise noted, content on this website and data uploaded to the website are licensed under a Creative Commons Attribution 4.0 International license (CC BY 4.0). When sharing or publishing user data, the user can specify a license other than CC BY 4.0. If no license is specified, the CC BY 4.0 license will be automatically applied to the content with a shared link or a public link.</p>
        <p>5. Data will be tagged mainly by the user, but tags can also be set automatically by features enabled or triggered by the user. These automatically generated tags will have the same effect as if set by the user manually.</p>
        <p>6. Data uploaded to the website should be assigned correct tags. We reserve the right to change incorrect tags or remove data without notice.</p>
        <p>7. For the purpose of maintenance and development of the website, the site administrator and developers are allowed to inspect, modify, and remove any data uploaded to the website without notice. </p>
        <p>8. User identity (including e-mail, user id and password) should only be used by the user through the web interface with a web browser, the user is not allowed to use the website service through a software, a script or a robot not provided by the website.</p>
      </md-card-content>
    </md-card>

  </div>
</template>

<script>
export default {
  name: 'tos',
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
