<template>
  <div class="joy">
    <div class="joy-container">
      <div class="joy-editor" ref="editor"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'options',
  props:{
    init:{
      type: String,
      default: ()=>{

        return "joy workflow."
      }
    },
    data: {
      type: String,
      default: ()=>{
        return Joy.loadFromURL()
      }
    },
    modules: {
      type: Array,
      default: ()=>{
        return ["instructions", "math", 'random']
      }
    }
  },
  data () {
    return {
      router: this.$root.$data.router,
      store: this.$root.$data.store,
      api: this.$root.$data.store.api
    }
  },
  mounted(){
    this.setupJoy()
  },
  watch: {
  	init: function(newVal, oldVal) { // watch it
      console.log('Prop changed: ', newVal, ' | was: ', oldVal)
      setupJoy()
    }
  },
  methods: {
    setupJoy() {
      this.$refs.editor.innerHTML = ''
      
      Joy({
        // Where the Joy editor goes:
        container: this.$refs.editor,

        // The words & actors inside the editor:
        init: this.init, //"{id:'localizationWorkflow', type:'actions'} " + // a list of actions
          //"<hr> {type:'save'}", // a save button!

        // Load data from URL, otherwise blank:
        data: this.data,

        // Other actions to include, beyond turtle actions:
        modules: this.modules,

        // What to do when the user makes a change:
        onupdate: (my) => {
          // turtle.start();
          // my.turtleInstructions.act(turtle);
          // turtle.draw();
          this.$emit('onupdate', my)
        }
      });
    },
    runJoy() {

      // if (this._action) {
      //   console.log('run joy.')
      //   const myTarget = {
      //     a: 1000
      //   }
      //   this._action(myTarget).then((res) => {
      //     console.log('action finished: ', res)
      //   })
      // }
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.joy-container {
  text-decoration: none;
  margin: 0;
  font-family: Helvetica, Arial, sans-serif;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: block;
}

.joy-editor {
  width: 100%;
  height: 100%;
  float: left;
  /* background: #eee; */
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 18px;
  font-weight: 100;
}
</style>
