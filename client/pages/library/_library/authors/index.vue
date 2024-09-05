<template>
  <div class="page" :class="streamLibraryItem ? 'streaming' : ''">
    <app-book-shelf-toolbar page="authors" is-home :authors="authors" />
    <div id="bookshelf" class="w-full h-full p-8e overflow-y-auto" :style="{ fontSize: sizeMultiplier + 'rem' }">
      <!-- Cover size widget -->

      <widgets-cover-size-widget class="fixed right-4 z-50" :style="{ bottom: streamLibraryItem ? '181px' : '16px' }" />
      <div class="flex flex-wrap justify-center">
        <div v-if="selectedAuthors.length > 0" class="select-bar w-full p-2 text-white flex justify-between items-center">
          <span>{{ selectedAuthors.length }} Authors Selected</span>
          <div>
            <ui-btn type="button" :class="mergeButtonClass" @click="openMergeModal" :disabled="selectedAuthors.length !== 2">Merge</ui-btn>
            <ui-btn type="button" :class="makeAliasButtonClass" @click="openMakeAliasModal" :disabled="selectedAuthors.length !== 2">Make Alias</ui-btn>
          </div>
        </div>
        <template v-for="author in authorsSorted">
          <div class="author-card-container p-3e">
            <cards-author-card :key="author.id" :author="author" @edit="editAuthor" @select="handleSelect" />
          </div>
        </template>
      </div>
    </div>

    <edit-modal />
    <merge-author-modal :authorA="selectedAuthors[0]" :authorB="selectedAuthors[1]" v-if="isMergeModalVisible" @close="closeMergeModal" />
    <make-alias-modal :authorA="selectedAuthors[0]" :authorB="selectedAuthors[1]" v-if="isMakeAliasModalVisible" @close="closeMakeAliasModal" />
  </div>
</template>

<script>
import EditModal from '@/components/modals/authors/EditModal.vue'
import MakeAliasModal from '@/components/modals/authors/MakeAliasModal.vue'
import MergeAuthorModal from '@/components/modals/authors/MergeModal.vue'

export default {
  components: {
    MergeAuthorModal,
    MakeAliasModal,
    EditModal
  },
  async asyncData({ store, params, redirect }) {
    var libraryId = params.library
    var libraryData = await store.dispatch('libraries/fetch', libraryId)
    if (!libraryData) {
      return redirect('/oops?message=Library not found')
    }

    const library = libraryData.library
    if (library.mediaType === 'podcast') {
      return redirect(`/library/${libraryId}`)
    }

    return {
      libraryId
    }
  },
  data() {
    return {
      loading: true,
      authors: [],
      // selectedAuthorsMap: {},
      selectedAuthors: [],
      isMergeModalVisible: false,
      isMakeAliasModalVisible: false
    }
  },
  computed: {
    sizeMultiplier() {
      return this.$store.getters['user/getSizeMultiplier']
    },
    streamLibraryItem() {
      return this.$store.state.streamLibraryItem
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    // selectedAuthors() {
    //   return this.authors.filter((author) => this.selectedAuthorsMap[author.id])
    // },
    mergeButtonClass() {
      return this.selectedAuthors.length === 2 ? 'btn-primary' : 'btn-disabled'
    },
    makeAliasButtonClass() {
      return this.selectedAuthors.length === 2 ? 'btn-primary' : 'btn-disabled'
    },
    authorSortBy() {
      return this.$store.getters['user/getUserSetting']('authorSortBy') || 'name'
    },
    authorSortDesc() {
      return !!this.$store.getters['user/getUserSetting']('authorSortDesc')
    },
    authorsSorted() {
      const sortProp = this.authorSortBy
      const bDesc = this.authorSortDesc ? -1 : 1
      return this.authors.sort((a, b) => {
        if (typeof a[sortProp] === 'number' && typeof b[sortProp] === 'number') {
          return a[sortProp] > b[sortProp] ? bDesc : -bDesc
        }
        const aVal = a[sortProp] || ''
        const bVal = b[sortProp] || ''
        return aVal.localeCompare(bVal, undefined, { sensitivity: 'base' }) * bDesc
      })
    }
  },
  methods: {
    async init() {
      this.authors = await this.$axios
        .$get(`/api/libraries/${this.currentLibraryId}/authors`)
        .then((response) => response.authors)
        .catch((error) => {
          console.error('Failed to load authors', error)
          return []
        })
      this.loading = false
    },
    authorAdded(author) {
      if (!this.authors.some((au) => au.id === author.id)) {
        this.authors.push(author)
      }
    },
    authorUpdated(author) {
      this.authors = this.authors.map((au) => {
        if (au.id === author.id) {
          return author
        }
        return au
      })
    },
    authorRemoved(author) {
      this.authors = this.authors.filter((au) => au.id !== author.id)
    },
    editAuthor(author) {
      // this.confirmMerge(() => {
      this.$store.commit('globals/showEditAuthorModal', author)
      //   })
    },
    async handleSelect({ author, isSelected }) {
      console.log('author id:' + author.id + ' Select state:' + isSelected)
      if (isSelected) {
        if (!this.selectedAuthors.some((selectedAuthor) => selectedAuthor.id === author.id)) {
          // 在此处调用 API 获取 alias 信息
          const alias = await this.fetchAuthorAlias(author.id)
          author.alias = alias || [] // 将 alias 信息添加到 author 对象中

          this.selectedAuthors.push(author)
        }
      } else {
        this.selectedAuthors = this.selectedAuthors.filter((selectedAuthor) => selectedAuthor.id !== author.id)
      }
      console.log(this.selectedAuthors)
    },
    async fetchAuthorAlias(authorId) {
      try {
        const token = this.$store.getters['user/getToken']
        const response = await this.$axios.get(`/api/authors/${authorId}/alias`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        return response.data
      } catch (error) {
        console.error('Failed to fetch author alias:', error)
        return []
      }
    },
    openMergeModal() {
      console.log('authorA:' + this.selectedAuthors[0].name)
      console.log('authorB:' + this.selectedAuthors[1].name)
      this.isMergeModalVisible = true
      console.log(this.isMergeModalVisible)
    },
    closeMergeModal() {
      this.isMergeModalVisible = false
    },
    openMakeAliasModal() {
      this.isMakeAliasModalVisible = true
    },
    closeMakeAliasModal() {
      this.isMakeAliasModalVisible = false
    }
  },
  mounted() {
    this.init()
    this.$root.socket.on('author_added', this.authorAdded)
    this.$root.socket.on('author_updated', this.authorUpdated)
    this.$root.socket.on('author_removed', this.authorRemoved)
  },
  beforeDestroy() {
    this.$root.socket.off('author_added', this.authorAdded)
    this.$root.socket.off('author_updated', this.authorUpdated)
    this.$root.socket.off('author_removed', this.authorRemoved)
  }
}
</script>

<style scoped>
.btn-primary {
  background-color: #809f52;
  color: #ffffff;
}

.btn-disabled {
  background-color: #838383;
  color: #ffffff;
}
</style>
