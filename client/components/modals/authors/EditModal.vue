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
            <div class="p-2">
              <ui-textarea-with-label v-model="authorCopy.description" :disabled="processing" :label="$strings.LabelDescription" :rows="8" />
            </div>

            <div class="mb-2">
              <h3 @click="toggleAliasDropdown" class="dropdown-icon"><strong>Manage Alias</strong><span class="material-symbols text-2xl">expand_more</span></h3>

              <div v-if="showAliasDropdown" class="m-2">
                <p v-if="authorCopy.aliases.length > 0">{{ authorCopy.name }} has below aliases:</p>
                <p v-else-if="currentAuthorStatus === 'Alias'">{{ authorCopy.name }} is an alias of:</p>
                <p v-else-if="currentAuthorStatus === 'Combined Alias'">{{ authorCopy.name }} is an alias shared by below authors:</p>
                <p v-else>{{ authorCopy.name }} does not have any alias.</p>

                <div v-if="authorCopy.aliases.length > 0" color="primary" class="alias-container p-2">
                  <div v-for="alias in authorCopy.aliases" :key="alias.id" class="alias-item p-2">
                    <div class="alias-left">
                      <span class="alias-bullet">&nbsp;•&nbsp;&nbsp;&nbsp;</span>
                      <span class="alias-name">{{ alias.name }}</span>
                    </div>
                    <div class="alias-right">
                      <ui-btn small color="error" type="button" @click="unlinkAliasRelation(alias)">Unlink</ui-btn>
                    </div>
                  </div>
                </div>

                <div v-if="authorCopy.originalAuthor.length > 0" color="primary" class="alias-container p-2">
                  <div v-for="originalAuthor in authorCopy.originalAuthor" :key="originalAuthor.id" class="alias-item p-2">
                    <div class="alias-left">
                      <span class="alias-bullet">&nbsp;•&nbsp;&nbsp;&nbsp;</span>
                      <span class="alias-name">{{ originalAuthor.name }}</span>
                    </div>
                    <div class="alias-right">
                      <ui-btn small color="error" type="button" @click="unlinkAliasRelation(originalAuthor)">Unlink</ui-btn>
                    </div>
                  </div>
                </div>

                <div v-if="currentAuthorStatus === 'Alias' || currentAuthorStatus === 'Combined Alias'" class="flex">
                  <ui-btn type="button" color="success" small @click="openAddOriginModal" class="combined-alias-btn">Add more ...</ui-btn>
                </div>
                <div v-if="currentAuthorStatus === 'Original Author'" class="flex">
                  <ui-btn type="button" small color="success" @click="openAddAliasModal" class="combined-alias-btn">Add more ...</ui-btn>
                </div>
                <div v-if="currentAuthorStatus === 'Unknown'" class="flex items-center">
                  <ui-btn type="button" small color="success" @click="openAddAliasModal" class="combined-alias-btn">Add Alias</ui-btn>
                  <ui-btn type="button" small color="success" @click="openAddOriginModal" class="combined-alias-btn">Add Original Author</ui-btn>
                </div>
              </div>
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
    <CombineAliasModal v-if="!isLoading && showCombineModal" v-model="showCombineModal" :author="authorCopy" @update-authors="handleUpdatedAuthors" />
    <AddAliasModal v-if="!isLoading && showAddAliasModal" v-model="showAddAliasModal" :author="authorCopy" @update-aliases="updateAliases" />
  </modals-modal>
</template>


<script>
import CombineAliasModal from './AddOriginModal.vue'
import AddAliasModal from '@/components/modals/authors/AddAliasModal.vue'

export default {
  components: {
    AddAliasModal,
    CombineAliasModal
  },
  data() {
    return {
      showCombineModal: false,
      showAddAliasModal: false,
      isLoading: false,
      newAlias: '',
      authorCopy: {
        name: '',
        asin: '',
        description: '',
        aliases: [],
        originalAuthor: []
      },

      imageUrl: '',
      currentAuthorStatus: '',
      showAliasDropdown: false,
      processing: false
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
            originalAuthor: newVal.originalAuthor || []
          }
          this.checkAuthorStatus()
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
    toggleAliasDropdown() {
      this.showAliasDropdown = !this.showAliasDropdown
    },
    updateAliases(updatedAliases) {
      this.authorCopy.aliases = updatedAliases
    },
    handleUpdatedAuthors(updateOrginalAuthor) {
      // 处理接收到的 authorIds，例如更新父组件的数据或调用 API
      // this.authorCopy.originalAuthor = updateOrginalAuthor
      this.authorCopy = {
        ...this.authorCopy,
        originalAuthor: updateOrginalAuthor
      }
      console.log('Updated author list from child:', updateOrginalAuthor)
    },
    async checkAuthorStatus() {
      if (this.author.is_alias_of === null) {
        await this.checkIfOriginalAuthor()
      } else if (this.author.is_alias_of === 0) {
        this.currentAuthorStatus = 'Combined Alias'
        await this.fetchOriginalAuthors()
      } else {
        this.currentAuthorStatus = 'Alias'
        await this.fetchOriginAuthor()
      }
    },
    async checkIfOriginalAuthor() {
      const aliases = await this.fetchAliases()
      const combinedAliases = await this.fetchCombinedAliases()

      if (aliases.length > 0 || combinedAliases.length > 0) {
        this.currentAuthorStatus = 'Original Author'
        this.authorCopy.aliases = [...aliases, ...combinedAliases]
      } else {
        this.currentAuthorStatus = 'Unknown'
        this.authorCopy.aliases = []
      }
    },
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
    async fetchCombinedAliases() {
      try {
        const combinedAliases = await this.$axios.$get(`/api/authors/${this.authorId}/combined_alias`)
        console.log('Fetched combined aliases:', combinedAliases)
        return combinedAliases || []
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn('No combined alias found for this author')
          return []
        } else {
          console.error('Error fetching combined aliases:', error)
          return []
        }
      }
    },
    async fetchOriginalAuthors() {
      try {
        const originalAuthors = await this.$axios.$get(`/api/authors/${this.authorId}/origins`)
        console.log('Fetched original authors:', originalAuthors)
        this.authorCopy.originalAuthor = originalAuthors
      } catch (error) {
        console.error('Failed to fetch original authors:', error)
      }
    },
    async fetchOriginAuthor() {
      try {
        const originAuthor = await this.$axios.$get(`/api/authors/${this.authorId}/origin`)
        console.log('Fetched origin author:', originAuthor)
        this.authorCopy.originalAuthor = [originAuthor]
      } catch (error) {
        console.error('Failed to fetch origin author:', error)
      }
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
    // async submitForm() {
    //   //TODO: check source code
    //   //this.forceBlur()
    //   var keysToCheck = ['name', 'asin', 'description', 'authors']
    //   var updatePayload = {}
    //   // keysToCheck.forEach((key) => {
    //   //   // 对 authors 进行深度比较
    //   //   // if (key === 'authors') {
    //   //   //   // 这里用 objectArrayEqual 来比较 authors 是否有变动
    //   //   //   if (!this.objectArrayEqual(this.authorCopy.authors, this.author.authors)) {
    //   //   //     updatePayload.authors = this.authorCopy.authors.map((v) => ({ ...v }))
    //   //   //   }
    //   //   // } else if (this.authorCopy[key] !== this.author[key]) {
    //   //   //   updatePayload[key] = this.authorCopy[key]
    //   //   // }
    //   // })
    //    keysToCheck.forEach((key) => {
    //     if (this.authorCopy[key] !== this.author[key]) {
    //       updatePayload[key] = this.authorCopy[key]
    //     }
    //   })
    //   if (!Object.keys(updatePayload).length) {
    //     this.$toast.info(this.$strings.MessageNoUpdateNecessary)
    //     return
    //   }
    //   this.processing = true
    //   var result = await this.$axios
    //     .$patch(`/api/authors/${this.authorId}`, updatePayload)

    //     .catch((error) => {
    //       console.error('Failed', error)
    //       const errorMsg = error.response ? error.response.data : null
    //       this.$toast.error(errorMsg || this.$strings.ToastAuthorUpdateFailed)
    //       return null
    //     })
    //   if (result) {
    //     if (result.updated) {
    //       this.$toast.success(this.$strings.ToastAuthorUpdateSuccess)
    //       this.show = false
    //     } else if (result.merged) {
    //       this.$toast.success(this.$strings.ToastAuthorUpdateMerged)
    //       this.show = false
    //     } else this.$toast.info(this.$strings.MessageNoUpdatesWereNecessary)
    //   }
    //   this.processing = false
    // },
    async submitForm() {
      var keysToCheck = ['name', 'asin', 'description']
      var updatePayload = {}
      keysToCheck.forEach((key) => {
        if (this.authorCopy[key] !== this.author[key]) {
          updatePayload[key] = this.authorCopy[key]
        }
      })
      if (!Object.keys(updatePayload).length) {
        this.$toast.info(this.$strings.MessageNoUpdateNecessary)
        return
      }
      this.processing = true
      var result = await this.$axios.$patch(`/api/authors/${this.authorId}`, updatePayload).catch((error) => {
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
    async unlinkAliasRelation(author) {
      try {
        console.log('Author to be unlink: ' + author.name)
        console.log(this.authorId)
        await this.$axios.$delete(`/api/authors/${this.authorId}/alias`, { data: author }).catch((error) => {
          console.error('Failed to unlink alias relation', error)
        })
        this.authorCopy.aliases = this.authorCopy.aliases.filter((alias) => alias.id !== author.id)
        this.authorCopy.originalAuthor = this.authorCopy.originalAuthor.filter((original) => original.id !== author.id)
        this.$toast.success('Successfully unlink alias')
      } catch (error) {
        console.error('Failed to remove alias', error)
        this.$toast.error('Failed to unlink alias')
      }
    },
    openAddOriginModal() {
      this.showCombineModal = true
    },
    openAddAliasModal() {
      this.showAddAliasModal = true
    }
  },
  mounted() {
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


