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
        console.log('Selected authors before creation:', selectedAuthors)

        // 获取 libraryId 并确认它存在
        const libraryId = this.author.libraryId
        if (!libraryId) {
          console.error('Library ID not found')
          return
        }
        console.log('Library ID:', libraryId) // 打印 libraryId

        // 检查是否有新作者
        const newAuthors = selectedAuthors.filter((author) => !author.id || author.id.startsWith('new'))
        console.log('New authors to be created:', newAuthors)

        let authorIds = selectedAuthors.map((author) => author.id)

        if (newAuthors.length) {
          const mediaPayload = {
            metadata: {
              authors: selectedAuthors.map((author) => ({
                name: author.name, // 确保作者名称被传递
                id: author.id || null // 如果有 ID，则传递，否则为空
              }))
            }
          }
          console.log('Media Payload:', mediaPayload)

          const createdAuthors = await this.createAuthorsAndSeriesForItemUpdate(mediaPayload, libraryId)
          console.log('Created authors returned:', createdAuthors)
          if (createdAuthors && createdAuthors.length > 0) {
            // 将返回的新作者 ID 添加到原有的 authorIds 中
            const newAuthorIds = createdAuthors.map((author) => author.id)

            // 更新 authorIds，替换掉临时的 new IDs
            authorIds = authorIds.map((id) => (id.startsWith('new') ? newAuthorIds.shift() : id))

            // 确保新作者的 ID 被更新到 selectedAuthors 中
            newAuthors.forEach((author, index) => {
              author.id = newAuthorIds[index]
            })

            console.log('New authors created successfully.')
          } else {
            throw new Error('Failed to create new authors')
          }
        }

        // 合并作者
        console.log('Final Author IDs to be combined:', authorIds)

        await this.$axios.post(`/api/authors/${this.author.id}/combined_alias`, {
          originalAuthors: authorIds
        })

        this.$toast.success('Authors combined successfully')
      } catch (error) {
        console.error('Error combining authors:', error)
        this.$toast.error('Failed to combine authors')
      }
      // 关闭模态框
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
