<script setup lang="ts">
import { ref, type Ref } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 18
  }
})
const emit = defineEmits(["click"])

const isActive: Ref<boolean> = ref(false);

const onClick = () => {
    isActive.value = !isActive.value;
    emit("click");
}

defineExpose({ isActive })

</script>
<template>
    <div class="switch_outer" v-bind:class="{active: isActive}" v-on:click="onClick">
        <div class="toggle_switch" v-bind:class="{active: isActive}"></div>
    </div>
</template>

<style scoped>
.switch_outer {
    background-color: lightgray;
    border-radius: 30px;
    position: relative;
    cursor: pointer;
    transition: background-color .2s ease-in-out;
    width: v-bind($props.size * 2 + "px");
    height: v-bind($props.size + "px");    
}
.switch_outer.active {
    background-color: #51E373;
}
.toggle_switch {
    width: v-bind($props.size * 0.8 + "px");
    height: v-bind($props.size * 0.8 + "px");
    border-radius: 50%;
    position: absolute;
    background-color: white;
    top: 0;
    bottom: 0;
    left: v-bind($props.size * 0.08 + "px");;
    margin: auto;
    transition: left .3s ease-in-out;
}
.toggle_switch.active {
    left: v-bind($props.size * 1.1 + "px");
}

</style>