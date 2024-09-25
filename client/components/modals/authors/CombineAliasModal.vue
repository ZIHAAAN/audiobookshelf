<template>
  <!-- 使用 v-if 来控制模态框的显示 -->
  <div v-if="value" class="modal" style="padding: 20px; border: 1px solid black; width: 800px; margin: auto">
    <div v-if="author">
      <!-- 如果是 alias，显示原作者信息 -->
      <div v-if="author.is_alias_of !== null && author.is_alias_of != 0">
        <p>Original Author: {{ author.originalAuthor.name }}</p>
      </div>
      <div v-else-if="!author.is_alias_of && author.aliases.length">
        <p>Aliases:</p>
        <ul>
          <li v-for="alias in author.aliases" :key="alias.id">{{ alias.name }}</li>
        </ul>
      </div>
      <div v-else-if="author.is_alias_of === 0">
        <p>Combined Author: {{ author.name }}</p>
        <p>Authors:</p>
        <ul>
          <li v-for="originalAuthor in author.combinedAliases" :key="originalAuthor.id">{{ originalAuthor.name }}</li>
        </ul>
      </div>
    </div>
    <div class="p-2">
      <ui-multi-select-query-input ref="authorsSelect" v-model="authorCopy.authors" :label="$strings.LabelAuthors" filter-key="authors" />
    </div>

    <div class="flex justify-end pt-2 px-2">
      <ui-btn type="button" @click="cancel" class="cancel-btn mr-2">Cancel</ui-btn>
      <ui-btn type="submit" @click="confirm" class="confirm-btn">Confirm</ui-btn>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true
    },
    author: {
      type: Object,
      required: true
    }
  },
  computed: {
    filterData() {
      return this.$store.state.libraries.filterData || {}
    },
    authors() {
      return this.filterData.authors || [] // 用于提供作者选择数据（历史记录）
    }
  },
  watch: {
    author: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.authorCopy = {
            ...newVal,
            aliases: newVal.aliases || [],
            combinedAliases: newVal.combinedAliases || [],
            authors: newVal.authors || []
          }
        }
      }
    }
  },
  data() {
    return {
      newAuthor: '', // 新作者输入内容
      filteredAuthors: [], // 匹配到的历史记录
      authorCopy: {
        name: '',
        asin: '',
        description: '',
        aliases: [],
        combinedAliases: [],
        authors: [] // 用于存储选择的作者
      }
    }
  },
  methods: {
    forceBlur() {
      if (this.$refs.authorsSelect && this.$refs.authorsSelect.isFocused) {
        this.$refs.authorsSelect.forceBlur()
      }
    },
    // async search() {
    //   if (!this.textInput) return
    //   this.currentSearch = this.textInput
    //   const dataToSearch = this.authors || []

    //   // 过滤历史记录，匹配用户输入
    //   const results = dataToSearch.filter((author) => author.name.toLowerCase().includes(this.currentSearch.toLowerCase().trim()))

    //   this.items = results
    // },
    // 新建作者逻辑，使用你已有的 createAuthorsAndSeriesForItemUpdate 逻辑
    //     async createNewAuthorIfNeeded(authorName) {
    //     let newAuthor = null;
    //     try {
    //         // 调用你已经定义的处理创建作者的 API 逻辑
    //         const payload = { metadata: { authors: [{ name: authorName }] } };
    //         const response = await this.$axios.post('/api/authors', payload); // 假设有单独的作者创建 API 路径
    //         newAuthor = response.data.author; // 直接获取返回的创建好的作者
    //     } catch (error) {
    //         console.error('Error creating author:', error);
    //         this.$toast.error('Failed to create author');
    //     }
    //     return newAuthor;
    // }
    // ,
    addSelectedAuthor(author) {
      this.authorCopy.authors.push(author)
      this.textInput = null
    },

    cancel() {
      this.$emit('input', false)
    },
    async confirm() {
      try {
        const selectedAuthors = this.authorCopy.authors
        const newAuthors = selectedAuthors.filter((author) => !author.id || author.id.startsWith('new'))

        let authorIds = selectedAuthors
          .filter((author) => author.id && !author.id.startsWith('new'))
          .map((author) => author.id);

        if (newAuthors.length) {
          const mediaPayload = {
            metadata: {
              authors: selectedAuthors.map((author) => ({
                name: author.name,
                id: author.id || null
              }))
            }
          }

          const createdAuthors = await this.$axios.$post(`/api/authors/${this.author.id}/createNew`, mediaPayload)
          const createdAuthorIds = createdAuthors.map((author) => author.id);
          authorIds = [...authorIds.filter(id => !!id), ...createdAuthorIds];
        }

        console.log('Final Author IDs:', authorIds)
        await this.$axios.post(`/api/authors/${this.author.id}/combined_alias`, {
          originalAuthors: authorIds
        })

        this.$toast.success(`Successfully add original authors to ${this.author.name}`)
      } catch (error) {
        console.error('Error combining authors:', error)
        this.$toast.error('Failed to combine authors')
      }

      this.$emit('input', false)
    }
  },
  mounted() {
    console.log('Author data received11111:', this.author)
    if (!this.author.libraryId) {
      console.error('Library ID is missing from the author object')
    }
  }
}
</script>

<style scoped>
.modal {
  z-index: 9999;
  position: fixed;
  top: 50%;
  left: 50%;
  background-color: rgba(14, 17, 21, 0.895);
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
.history-list {
  background-color: rgb(92, 89, 89);
  list-style-type: none;
  margin: 0;
  padding: 0;
  max-height: 150px;
  overflow-y: auto;
}
.history-list li {
  padding: 10px;
  border-bottom: 1px solid #c6c5c5;
}
.history-list li:hover {
  background-color: #565454;
}
</style>
