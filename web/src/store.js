import Vue from 'vue';
const event_bus = new Vue();

export default {
  debug: true,
  wsuri: "wss://dai.pasteur.fr/ws",
  signed_in: false,
  event_bus: event_bus,
  authid: "",
  authrole: "",
  uid: "",
  api: {

  },
  session: null,
  connection: null,
}
