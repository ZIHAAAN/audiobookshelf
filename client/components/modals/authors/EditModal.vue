<template>
  <modals-modal v-model="show" name="edit-author" :width="800" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ title }}</p>
      </div>
    </template>
    <div v-if="author" class="p-4 w-full text-sm py-6 rounded-lg bg-bg shadow-lg border border-black-300 relative overflow-hidden" style="min-height: 400px; max-height: 80vh">
      <div class="flex">
        <div class="w-40 p-2">
          <div class="w-full h-45 relative">
            <covers-author-image :author="authorCopy" />
            <div v-if="userCanDelete && !processing && author.imagePath" class="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-100">
              <span class="absolute top-2 right-2 material-symbols text-error transform hover:scale-125 transition-transform cursor-pointer text-lg" @click="removeCover">delete</span>
            </div>
          </div>
        </div>
        <div class="flex-grow">
          <form @submit.prevent="submitUploadCover" class="flex flex-grow mb-2 p-2">
            <ui-text-input v-model="imageUrl" :placeholder="$strings.LabelImageURLFromTheWeb" class="h-9 w-full" />
            <ui-btn color="success" type="submit" :padding-x="4" :disabled="!imageUrl" class="ml-2 sm:ml-3 w-24 h-9">{{ $strings.ButtonSubmit }}</ui-btn>
          </form>

          <form v-if="author" @submit.prevent="submitForm">
            <div class="flex">
              <div class="w-3/4 p-2">
                <ui-text-input-with-label v-model="authorCopy.name" :disabled="processing" :label="$strings.LabelName" />
              </div>
              <div class="flex-grow p-2">
                <ui-text-input-with-label v-model="authorCopy.asin" :disabled="processing" label="ASIN" />
              </div>
            </div>

            <div v-if="authorCopy.aliases.length > 0" class="p-2">
              <p class="text-white text-opacity-60 uppercase text-xs mb-2">Aliases:</p>
              <div v-for="alias in authorCopy.aliases" :key="alias" class="flex justify-between items-center m-2">
                <span>{{ alias.name }}</span>
                <ui-btn color="error" small type="button" @click="removeAlias(alias)">Unlink</ui-btn>

                <button class="alias-action-btn" @click="convertToAlias(alias)">▼</button>
              </div>
            </div>

            <div v-else-if="authorCopy.originalAuthor" class="p-2">
              <p class="text-white text-opacity-60 uppercase text-xs mb-2">Original Author:</p>
              <span>{{ authorCopy.originalAuthor.name }}</span>
            </div>

            <div v-if="!authorCopy.originalAuthor" class="p-2 flex">
              <ui-text-input class="h-9 w-40" v-model="newAlias" :disabled="processing" placeholder="Enter alias" />
              <ui-btn class="add-alias-btn ml-2 sm:ml-3 w-18 h-9 items-center" color="success" type="button" @click="addAlias" :disabled="processing || !newAlias">ADD</ui-btn>
            </div>
            <div class="flex-grow p-2">
              <ui-btn color="success" @click="openCombineModal">Mark as Combined-alias</ui-btn>
            </div>
            <!-- <div class="p-2">
              <ui-multi-select-query-input ref="authorsSelect" v-model="authorCopy.authors" :label="$strings.LabelAuthors" filter-key="authors" />
            </div> -->
            <div class="p-2">
              <ui-textarea-with-label v-model="authorCopy.description" :disabled="processing" :label="$strings.LabelDescription" :rows="8" />
            </div>

            <div class="flex pt-2 px-2">
              <ui-btn v-if="userCanDelete" small color="error" type="button" @click.stop="removeClick">{{ $strings.ButtonRemove }}</ui-btn>
              <div class="flex-grow" />
              <ui-btn type="button" class="mx-2" @click="searchAuthor">{{ $strings.ButtonQuickMatch }}</ui-btn>

              <ui-btn type="submit">{{ $strings.ButtonSave }}</ui-btn>
            </div>
          </form>
        </div>
      </div>
    </div>
    <combine-alias-modal ref="combineAliasModal" :show="showCombineModal" :author="author" @save-authors="saveAuthors" @close="closeCombineModal" />
  </modals-modal>
</template>

<script>
import CombineAliasModal from './CombineAliasModal.vue'
export default {
  components: {
    CombineAliasModal
  },
  data() {
    return {
      newAlias: '',
      filteredAuthors: [], //When add an alias, it matches the database for an existing author with similar name
      authors: [], // 这里是 v-model 绑定的数组
      authorCopy: {
        name: '',
        asin: '',
        description: '',
        aliases: [],
        originalAuthor: null
      },
      imageUrl: '',
      processing: false,
      showCombineModal: false
    }
  },
  watch: {
    author: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.init()
        }
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showEditAuthorModal
      },
      set(val) {
        this.$store.commit('globals/setShowEditAuthorModal', val)
      }
    },
    author() {
      return this.$store.state.globals.selectedAuthor
    },
    authorId() {
      if (!this.author) return ''
      return this.author.id
    },
    // filterData() {
    //   return this.$store.state.libraries.filterData || {}
    // },
    // authors() {
    //   return this.filterData.authors || [] // 用于提供作者选择数据（历史记录）
    // },
    title() {
      return this.$strings.HeaderUpdateAuthor
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    libraryProvider() {
      return this.$store.getters['libraries/getLibraryProvider'](this.currentLibraryId) || 'google'
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    }
  },
  methods: {
    // forceBlur() {
    //   if (this.$refs.authorsSelect && this.$refs.authorsSelect.isFocused) {
    //     this.$refs.authorsSelect.forceBlur()
    //   }
    // },
    async init() {
      this.imageUrl = ''
      this.authorCopy = {
        ...this.author,
        aliases: this.author.aliases || [],
        authors: (this.author.authors || []).map((se) => ({ ...se })), // 初始化时填充作者列表
        originalAuthor: this.author.originalAuthor || null
      }
      // 根据 is_alias_of 判断逻辑
      if (this.author.is_alias_of === 0) {
        // 如果 is_alias_of 为 0，表示这是一个 combined alias，获取原作者
        await this.fetchOriginalAuthors()
        this.$toast.info('This author is a combined alias.')
      } else if (this.author.is_alias_of) {
        // 如果 is_alias_of 不为 0，表示是其他作者的 alias，显示 original author 信息
        this.$toast.info('This author is an alias.')
        await this.fetchOriginalAuthors()
      } else if (this.author.is_alias_of === null) {
        this.$toast.info('This author is an alias and has an original author.')
      }
      // 如果有别的 aliases，显示 alias 信息
      if (this.authorCopy.aliases.length > 0) {
        this.$toast.info('This author has aliases.')
      }
    },

    async fetchOriginalAuthors() {
      try {
        const response = await this.$axios.get(`/api/authors/${this.author.id}/origins`)

        // 根据响应内容更新 originalAuthors
        if (response.data.originalAuthors && response.data.originalAuthors.length > 0) {
          this.originalAuthors = response.data.originalAuthors
        } else {
          this.originalAuthors = []
        }
      } catch (error) {
        console.error('Error fetching original authors:', error)
      }
    },

    openCombineModal() {
      // 打开 combine modal
      this.showCombineModal = true
    },
    closeCombineModal() {
      // 关闭 combine modal
      this.showCombineModal = false
    },
    saveAuthors(authors) {
      // 保存从 modal 传来的 authors 数据
      this.authorCopy.authors = authors
      this.showCombineModal = false
    },

    removeClick() {
      const payload = {
        message: this.$getString('MessageConfirmRemoveAuthor', [this.author.name]),
        callback: (confirmed) => {
          if (confirmed) {
            this.processing = true
            this.$axios
              .$delete(`/api/authors/${this.authorId}`)
              .then(() => {
                this.$toast.success('Author removed')
                this.show = false
              })
              .catch((error) => {
                console.error('Failed to remove author', error)
                this.$toast.error('Failed to remove author')
              })
              .finally(() => {
                this.processing = false
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    async submitForm() {
      // this.forceBlur()
      var keysToCheck = ['name', 'asin', 'description', 'authors']
      var updatePayload = {}
      keysToCheck.forEach((key) => {
        // 对 authors 进行深度比较
        if (key === 'authors') {
          // 这里用 objectArrayEqual 来比较 authors 是否有变动
          if (!this.objectArrayEqual(this.authorCopy.authors, this.author.authors)) {
            updatePayload.authors = this.authorCopy.authors.map((v) => ({ ...v }))
          }
        } else if (this.authorCopy[key] !== this.author[key]) {
          updatePayload[key] = this.authorCopy[key]
        }
      })
      if (!Object.keys(updatePayload).length) {
        this.$toast.info(this.$strings.MessageNoUpdateNecessary)
        return
      }
      this.processing = true
      var result = await this.$axios
        .$patch(`/api/authors/${this.authorId}`, updatePayload)

        .catch((error) => {
          console.error('Failed', error)
          const errorMsg = error.response ? error.response.data : null
          this.$toast.error(errorMsg || this.$strings.ToastAuthorUpdateFailed)
          return null
        })
      if (result) {
        if (result.updated) {
          this.$toast.success(this.$strings.ToastAuthorUpdateSuccess)
          this.show = false
        } else if (result.merged) {
          this.$toast.success(this.$strings.ToastAuthorUpdateMerged)
          this.show = false
        } else this.$toast.info(this.$strings.MessageNoUpdatesWereNecessary)
      }
      this.processing = false
    },
    objectArrayEqual(array1, array2) {
      if (!Array.isArray(array1) || !Array.isArray(array2)) return false
      if (array1.length !== array2.length) return false

      for (let i = 0; i < array1.length; i++) {
        const item1 = array1[i]
        const item2 = array2[i]

        // 比较每个对象的属性
        if (item1.id !== item2.id || item1.name !== item2.name) {
          return false
        }
      }

      return true
    },
    removeCover() {
      this.processing = true
      this.$axios
        .$delete(`/api/authors/${this.authorId}/image`)
        .then((data) => {
          this.$toast.success(this.$strings.ToastAuthorImageRemoveSuccess)

          this.authorCopy.updatedAt = data.author.updatedAt
          this.authorCopy.imagePath = data.author.imagePath
        })
        .catch((error) => {
          console.error('Failed', error)
          this.$toast.error(this.$strings.ToastAuthorImageRemoveFailed)
        })
        .finally(() => {
          this.processing = false
        })
    },
    submitUploadCover() {
      if (!this.imageUrl?.startsWith('http:') && !this.imageUrl?.startsWith('https:')) {
        this.$toast.error('Invalid image url')
        return
      }

      this.processing = true
      const updatePayload = {
        url: this.imageUrl
      }
      this.$axios
        .$post(`/api/authors/${this.authorId}/image`, updatePayload)
        .then((data) => {
          this.imageUrl = ''
          this.$toast.success('Author image updated')

          this.authorCopy.updatedAt = data.author.updatedAt
          this.authorCopy.imagePath = data.author.imagePath
        })
        .catch((error) => {
          console.error('Failed', error)
          this.$toast.error(error.response.data || 'Failed to remove author image')
        })
        .finally(() => {
          this.processing = false
        })
    },
    async searchAuthor() {
      if (!this.authorCopy.name && !this.authorCopy.asin) {
        this.$toast.error('Must enter an author name')
        return
      }
      this.processing = true

      const payload = {}
      if (this.authorCopy.asin) payload.asin = this.authorCopy.asin
      else payload.q = this.authorCopy.name

      payload.region = 'us'
      if (this.libraryProvider.startsWith('audible.')) {
        payload.region = this.libraryProvider.split('.').pop() || 'us'
      }

      var response = await this.$axios.$post(`/api/authors/${this.authorId}/match`, payload).catch((error) => {
        console.error('Failed', error)
        return null
      })
      if (!response) {
        this.$toast.error('Author not found')
      } else if (response.updated) {
        if (response.author.imagePath) {
          this.$toast.success(this.$strings.ToastAuthorUpdateSuccess)
        } else this.$toast.success(this.$strings.ToastAuthorUpdateSuccessNoImageFound)

        this.authorCopy = {
          ...response.author
        }
      } else {
        this.$toast.info('No updates were made for Author')
      }
      this.processing = false
    },
    async removeAlias(alias) {
      this.processing = true
      try {
        await this.$axios.$delete(`/api/authors/${this.authorId}/alias`, {
          data: { name: alias.name }
        })
        this.authorCopy.aliases = this.authorCopy.aliases.filter((a) => a.name !== alias.name)
        this.$toast.success('Alias removed successfully')
      } catch (error) {
        console.error('Failed to remove alias', error)
        this.$toast.error('Failed to remove alias')
      } finally {
        this.processing = false
      }
    },
    async addAlias() {
      if (!this.newAlias.trim()) return

      this.processing = true
      try {
        const response = await this.$axios.$post(`/api/authors/${this.authorId}/alias`, { name: this.newAlias })
        this.authorCopy.aliases.push(response.alias)
        this.newAlias = ''
        this.$toast.success('Alias added successfully')
      } catch (error) {
        console.error('Failed to add alias', error)
        this.$toast.error('Failed to add alias')
      } finally {
        this.processing = false
      }
    }
  },
  mounted() {},
  beforeDestroy() {}
}
</script>

<style scoped>
.add-alias-btn {
  padding-left: 0;
  padding-right: 0;
}
</style>
