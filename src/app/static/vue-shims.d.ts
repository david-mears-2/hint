// static/vue-shims.d.ts
declare module "*.vue" {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

declare module 'vue3-treeselect';
declare module "vue-feather";
// declare module 'chartjs-plugin-annotation';
// declare module 'chartjs-plugin-error-bars';

//export {}  // Important! See note.
// declare module '@vue-leaflet/vue-leaflet';
