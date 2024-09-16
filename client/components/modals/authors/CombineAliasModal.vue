<template>
  <modals-modal v-model="show" name="combine-alias-modal" :width="800" :height="'unset'">
    <div class="p-4 w-full text-sm py-6 rounded-lg bg-bg shadow-lg border border-black-300">
      <!-- 如果是 combined alias 或 alias，显示原作者信息 -->
      <div v-if="originalAuthors.length > 0" class="p-2">
        <p class="text-white">This author is an alias of:</p>
        <ul>
          <li v-for="author in originalAuthors" :key="author.id">
            <strong>{{ author.name }}</strong>
          </li>
        </ul>
      </div>

      <!-- 始终显示 author 选择框 -->
      <div class="p-2">
        <ui-multi-select-query-input ref="authorsSelect" v-model="authorCopy.authors" :label="$strings.LabelAuthors" filter-key="authors" />
      </div>

      <div class="flex justify-end pt-2 px-2">
        <ui-btn type="button" @click="cancel" class="cancel-btn mr-2">Cancel</ui-btn>
        <ui-btn type="submit" @click="confirm" class="confirm-btn">Confirm</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false
    },
    author: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      authorCopy: {
        authors: []
      },
      originalAuthors: [] // 用来保存原作者信息
    }
  },
  methods: {
    init(originalAuthors, isAliasOf) {
      this.originalAuthors = originalAuthors
      this.authorCopy.authors = this.author.authors || []
      if (isAliasOf === null) {
        this.$toast.info('This author is not an alias and has no original authors.')
      }
    },
    confirm() {
      this.$emit('save-authors', this.authorCopy.authors)
      this.$emit('close')
    },
    cancel() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.confirm-btn {
  background-color: #1e3a8a;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 1rem;
}
.confirm-btn:hover {
  background-color: #3b82f6;
}
.cancel-btn {
  background-color: #6b7280;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 1rem;
}
.cancel-btn:hover {
  background-color: #9ca3af;
}
</style>
