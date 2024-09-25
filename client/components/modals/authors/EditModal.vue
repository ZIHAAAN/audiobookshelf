<template>
  <modals-modal v-model="show" name="edit-author" :width="800" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ title }}</p>
      </div>
    </template>
    <div v-if="author" class="p-4 w-full text-sm py-6 rounded-lg bg-bg shadow-lg border border-black-300 relative" style="min-height: 400px; max-height: 80vh; overflow-y: auto">
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
              <!-- <p class="text-white text-opacity-60 uppercase text-xs mb-2">Aliases:</p>
              <div v-for="alias in authorCopy.aliases" :key="alias" class="flex justify-between items-center m-2">
                <span>{{ alias.name }}</span>
                <ui-btn color="error" small type="button" @click="removeAlias(alias)">Unlink</ui-btn>
              </div> -->
            </div>
            <!-- <div v-else-if="authorCopy.originalAuthor" class="p-2">
              <p class="text-white text-opacity-60 uppercase text-xs mb-2">Original Author:</p>
              <span>{{ authorCopy.originalAuthor.name }}</span>
            </div> -->

            <!-- <div v-if="!authorCopy.originalAuthor" class="p-2 flex">
              <ui-text-input class="h-9 w-40" v-model="newAlias" :disabled="processing" placeholder="Enter alias" />
              <ui-btn class="add-alias-btn ml-2 sm:ml-3 w-18 h-9 items-center" color="success" type="button" @click="addAlias" :disabled="processing || !newAlias || currentAuthorStatus === 'Alias'">ADD</ui-btn>
            </div>
            <ui-btn v-if="currentAuthorStatus !== 'Original Author'" color="primary" type="button" @click="openCombineModal" class="combined-alias-btn"> Mark as Combined Alias </ui-btn> -->
            <!-- <ui-btn color="primary" type="button" @click="openNewCombineModal" class="combined-alias-btn"> Mark as Combined Alias </ui-btn> -->
            <!-- <div class="p-2">
              <ui-multi-select-query-input ref="authorsSelect" v-model="authorCopy.authors" :label="$strings.LabelAuthors" filter-key="authors" />
            </div> -->
            <!-- Alias Status Dropdown Section -->
            <div class="p-2">
              <h3 @click="toggleAliasDropdown" class="dropdown-icon">Author Status ▼</h3>
              <!-- <span @click="toggleAliasDropdown" class="dropdown-icon">▼</span> -->
              <!-- <div class="flex items-center"> -->
              <!-- <ui-btn color="primary" type="button" @click="toggleAliasDropdown">{{ authorStatusText }}</ui-btn> -->
              <!-- <span class="author-status-text">{{ authorStatusText }}</span> -->

              <!-- <span @click="toggleAliasDropdown" class="dropdown-icon">▼</span> -->
              <!-- </div> -->
              <div v-if="showAliasDropdown">
                <!-- <p v-if="authorCopy.originalAuthor" class="text-gray-500">Original Author: {{ authorCopy.originalAuthor.name }}</p> -->
                <!-- <p>Current Author Status: {{ currentAuthorStatus }}</p> -->
                <p v-if="authorCopy.aliases.length > 0">{{ authorCopy.name }} has below aliases:</p>
                <p v-else-if="currentAuthorStatus === 'Alias'">{{ authorCopy.name }} is an alias of: {{ authorCopy.originalAuthor.name }}</p>
                <p v-else-if="currentAuthorStatus === 'Combined Alias'">{{ authorCopy.name }} is a combined alias of: {{ authorCopy.originalAuthor.name }}</p>

                <p v-else>{{ authorCopy.name }} does not have any alias.</p>
                <div v-if="authorCopy.aliases.length > 0" color="primary" class="alias-container">
                  <!-- alias 列表 -->
                  <div v-for="alias in authorCopy.aliases" :key="alias.id" class="alias-item">
                    <div class="alias-left">
                      <span class="alias-bullet">•</span>
                      <span class="alias-name">{{ alias.name }}</span>
                    </div>
                    <div class="alias-right">
                      <span @click="removeAlias(alias)" class="delete-alias-btn">
                        <span class="circle">
                          <span class="cross">x</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Display Combined Aliases -->
                <div v-if="authorCopy.combinedAliases.length > 0">
                  <h4>Combined Aliases:</h4>

                  <div v-for="combinedAlias in authorCopy.combinedAliases" :key="combinedAlias.id" class="alias-item">
                    <div class="alias-left">
                      <span class="alias-bullet">•</span>
                      <span class="alias-name">{{ combinedAlias.name }}</span>
                      <!-- <ui-btn color="error" small type="button" @click="removeCombinedAlias(combinedAlias)">Delete Combined Alias</ui-btn> -->
                    </div>
                    <div class="alias-right">
                      <span @click="removeCombinedAlias(combinedAlias)" class="delete-alias-btn">
                        <span class="circle">
                          <span class="cross">x</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 如果 currentAuthorStatus 是 Alias 或 Combined Alias，显示 "Add Original Author" -->
            <div v-if="currentAuthorStatus === 'Alias' || currentAuthorStatus === 'Combined Alias'" class="p-2 flex">
              <ui-btn color="primary" type="button" @click="openCombineModal" class="combined-alias-btn"> Add Original Author </ui-btn>
            </div>

            <!-- 如果 currentAuthorStatus 是 Original Author，显示 "Add Alias" -->
            <div v-if="currentAuthorStatus === 'Original Author'" class="p-2 flex">
              <ui-text-input class="h-9 w-40" v-model="newAlias" :disabled="processing" placeholder="Enter alias" />
              <ui-btn class="add-alias-btn ml-2 sm:ml-3 w-18 h-9 items-center" color="success" type="button" @click="addAlias" :disabled="processing || !newAlias"> ADD </ui-btn>
            </div>

            <!-- 如果 currentAuthorStatus 是 Unknown，显示 "Add Original Author" 和 "Add Alias" -->
            <!-- <div v-if="currentAuthorStatus === 'Unknown'" class="p-2 flex">
              <ui-btn color="primary" type="button" @click="openCombineModal" class="combined-alias-btn"> Add Original Author </ui-btn>
              <div class="ml-4">
                <ui-text-input class="h-9 w-40" v-model="newAlias" :disabled="processing" placeholder="Enter alias" />
                <ui-btn class="add-alias-btn ml-2 sm:ml-3 w-18 h-9 items-center" color="success" type="button" @click="addAlias" :disabled="processing || !newAlias"> ADD </ui-btn>
              </div>
            </div> -->
            <div v-if="currentAuthorStatus === 'Unknown'" class="p-2 flex items-center">
              <ui-btn color="primary" type="button" @click="openCombineModal" class="combined-alias-btn mr-4"> Add Original Author </ui-btn>

              <div class="flex items-center">
                <ui-text-input class="h-9 w-40 mr-2" v-model="newAlias" :disabled="processing" placeholder="Enter alias" />
                <ui-btn class="add-alias-btn w-18 h-9 items-center" color="success" type="button" @click="addAlias" :disabled="processing || !newAlias"> ADD </ui-btn>
              </div>
            </div>

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
    <!--
    <CombineAliasModal v-if="showCombineModal" v-model="showCombineModal" :author="authorCopy" :original-authors="authorCopy.originalAuthor" :combined-aliases="authorCopy.combinedAliases" /> -->
    <CombineAliasModal v-if="!isLoading && showCombineModal" v-model="showCombineModal" :author="authorCopy" />
    <NewCombineAliasModal v-model="showNewCombineModal" />
  </modals-modal>
</template>


<script>
import CombineAliasModal from './CombineAliasModal.vue'

import NewCombineAliasModal from './NewCombineAliasModal.vue'
export default {
  components: {
    CombineAliasModal,
    NewCombineAliasModal
  },
  data() {
    return {
      showCombineModal: false,
      showNewCombineModal: false,
      isLoading: false,
      newAlias: '',
      // filteredAuthors: [], //When add an alias, it matches the database for an existing author with similar name
      //authors: [], // 这里是 v-model 绑定的数组
      authorCopy: {
        name: '',
        asin: '',
        description: '',
        aliases: [],
        combinedAliases: [],
        originalAuthor: null
      },
      imageUrl: '',
      currentAuthorStatus: '',
      showAliasDropdown: false,
      processing: false
      //selectedAuthor: null
    }
  },
  watch: {
    author: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          //this.init()
          this.authorCopy = {
            ...newVal,
            aliases: newVal.aliases || [],
            combinedAliases: newVal.combinedAliases || [],
            originalAuthor: newVal.originalAuthor || null
          }
          this.checkAuthorStatus()
        }
      }
    }
  },
  computed: {
    authorStatusText() {
      return this.currentAuthorStatus || 'Unknown'
    },
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
    toggleAliasDropdown() {
      this.showAliasDropdown = !this.showAliasDropdown
    },
    // 判断作者状态
    async checkAuthorStatus() {
      if (this.author.is_alias_of === null) {
        await this.checkIfOriginalAuthor() // 检查是否为Original Author
      } else if (this.author.is_alias_of === 0) {
        this.currentAuthorStatus = 'Combined Alias'
        await this.fetchOriginalAuthors() // 获取组合作者的信息
      } else {
        this.currentAuthorStatus = 'Alias'
        await this.fetchOriginAuthor() // 获取原始作者
      }
    },
    async checkIfOriginalAuthor() {
      const aliases = await this.fetchAliases()

      let combinedAliases = [] // 先设置默认空数组
      // 只有在没有 alias 的情况下才尝试获取 combined aliases
      if (aliases.length === 0) {
        combinedAliases = await this.fetchCombinedAliases()
      }

      //const combinedAliases = await this.fetchCombinedAliases()
      if (aliases.length > 0 || combinedAliases.length > 0) {
        this.currentAuthorStatus = 'Original Author'
        this.authorCopy.aliases = aliases
        this.authorCopy.combinedAliases = combinedAliases
      } else {
        this.currentAuthorStatus = 'Unknown'
      }
    },
    // Fetch aliases from API
    async fetchAliases() {
      try {
        const aliases = await this.$axios.$get(`/api/authors/${this.authorId}/alias`)
        console.log('Fetched aliases:', aliases)
        return aliases || []
      } catch (error) {
        console.error('Error fetching aliases:', error)
        return []
      }
    },

    // Fetch combined aliases from API
    async fetchCombinedAliases() {
      try {
        const combinedAliases = await this.$axios.$get(`/api/authors/${this.authorId}/combined_alias`)
        console.log('Fetched combined aliases:', combinedAliases)
        return combinedAliases || []
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn('No combined alias found for this author')
          return [] // 返回空数组，表示没有找到组合别名
        } else {
          console.error('Error fetching combined aliases:', error)
          return []
        }
      }
    },

    // Fetch original authors
    async fetchOriginalAuthors() {
      try {
        const originalAuthors = await this.$axios.$get(`/api/authors/${this.authorId}/origins`)
        console.log('Fetched original authors:', originalAuthors)
        if (originalAuthors.length > 0) {
          this.authorCopy.originalAuthor = originalAuthors[0]
        }
      } catch (error) {
        console.error('Failed to fetch original authors:', error)
      }
    },

    // Fetch origin author if the author is an alias
    async fetchOriginAuthor() {
      try {
        const originAuthor = await this.$axios.$get(`/api/authors/${this.authorId}/origin`)
        console.log('Fetched origin author:', originAuthor)
        this.authorCopy.originalAuthor = originAuthor
      } catch (error) {
        console.error('Failed to fetch origin author:', error)
      }
    },
    // init() {
    //   this.imageUrl = ''
    //   this.authorCopy = {
    //     ...this.author,
    //     aliases: this.author.aliases || [],
    //     authors: (this.author.authors || []).map((se) => ({ ...se })), // 初始化时填充作者列表
    //     originalAuthor: this.author.originalAuthor || null
    //   }
    // },
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
      //this.forceBlur()
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
    // objectArrayEqual(array1, array2) {
    //   if (!Array.isArray(array1) || !Array.isArray(array2)) return false
    //   if (array1.length !== array2.length) return false

    //   for (let i = 0; i < array1.length; i++) {
    //     const item1 = array1[i]
    //     const item2 = array2[i]

    //     // 比较每个对象的属性
    //     if (item1.id !== item2.id || item1.name !== item2.name) {
    //       return false
    //     }
    //   }

    //   return true
    // },
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
    // Remove combined alias
    async removeCombinedAlias(combinedAlias) {
      this.processing = true
      try {
        await this.$axios.$delete(`/api/authors/${this.author.id}/combined_alias`, {
          data: {
            authorId: this.author.id,
            aliasId: combinedAlias.id
          }
        })
        // 从 combinedAliases 数组中过滤掉已删除的 alias
        this.authorCopy.combinedAliases = this.authorCopy.combinedAliases.filter((a) => a.id !== combinedAlias.id)
        this.$toast.success('Combined Alias removed successfully')
      } catch (error) {
        this.$toast.error('Failed to remove combined alias')
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
    },
    openCombineModal() {
      //  this.author = this.authorCopy // 确保你有正确的数据传递
      // this.authorCopy.aliases = this.authorCopy.aliases || []
      // this.authorCopy.combinedAliases = this.authorCopy.combinedAliases || []
      // this.authorCopy.originalAuthor = this.authorCopy.originalAuthor || null
      // this.authorCopy = {
      //   ...this.author,
      //   aliases: this.author.aliases || [],
      //   combinedAliases: this.author.combinedAliases || [],
      //   originalAuthor: this.author.originalAuthor || []
      // }
      console.log('Opening Combine Alias Modal')
      this.showCombineModal = true
      console.log('showCombineModal (父组件):', this.showCombineModal)
    },
    closeCombineModal() {
      this.showCombineModal = false
    },
    saveAuthors(authors) {
      // 这里可以处理保存后的逻辑，比如更新作者信息
      console.log('Selected Authors:', authors)
      this.closeCombineModal()
    },
    openNewCombineModal() {
      // 点击按钮时打开模态框
      this.authorCopy = {
        ...this.author,
        aliases: this.author.aliases || [],
        combinedAliases: this.author.combinedAliases || [],
        originalAuthor: this.author.originalAuthor || null
      }
      console.log('Opening Combine Alias Modal with authorCopy11111:', this.authorCopy)
      this.showNewCombineModal = true
      console.log('showNewCombineModal:', this.showNewCombineModal)
    }
  },
  mounted() {
    console.log('showCombineModal status:', this.show)
    console.log('CombineAliasModal mounted')
    this.$emit('input', true)
  },
  beforeDestroy() {}
}
</script>

<style scoped>
.add-alias-btn {
  padding-left: 0;
  padding-right: 0;
}

.combined-alias-btn {
  white-space: nowrap;
  background-color: rgb(99, 161, 99);
  padding: 0.5rem 1rem;
  width: fit-content;
  font-size: 1rem;
}
.author-status-text {
  font-weight: bold;
}

.dropdown-icon {
  margin-left: 10px;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
}
h3 {
  display: inline-block;
  margin-left: -10px;
  vertical-align: middle;
}
.alias-container {
  display: flex;
  flex-direction: column;
}

.alias-item {
  margin-bottom: 8px 0; /* 每行之间增加一些间距 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alias-left {
  display: flex;
  align-items: center;
}

.alias-right {
  margin-left: 75px;
}

.delete-alias-btn {
  cursor: pointer;
  display: inline-block;
}

.circle {
  border: 1px solid red;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cross {
  color: red;
  font-size: 14px;
}
</style>


