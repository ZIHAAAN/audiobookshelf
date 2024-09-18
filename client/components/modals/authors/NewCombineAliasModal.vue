<template>
  <!-- 使用 v-if="value" 来控制模态框的显示 -->
  <div v-if="value" class="modal" style="background-color: lightblue; padding: 20px; border: 1px solid black; width: 400px; height: 200px">
    <h3>New Combine Alias Modal</h3>
    <p>This is a new modal for testing</p>

    <!-- Cancel 按钮 -->
    <div class="flex justify-end">
      <ui-btn @click="closeModal">Cancel</ui-btn>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      // 父组件通过 v-model 传递的布尔值
      type: Boolean,
      required: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('input', false) // 通过 $emit 通知父组件关闭模态框
    }
  },
  mounted() {
    console.log('NewCombineAliasModal mounted with value:', this.value) // 输出 value 以进行调试
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
