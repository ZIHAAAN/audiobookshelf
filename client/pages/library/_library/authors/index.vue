<template>
  <div class="page" :class="streamLibraryItem ? 'streaming' : ''">
    <app-book-shelf-toolbar page="authors" is-home :authors="authors" />

    <div v-if="selectedAuthors.length > 0" class="toolbar fixed top-0 right-0 w-full bg-gray-900 text-white flex justify-end items-center px-4 py-2 z-50 shadow-lg rounded">
      <span class="mr-auto">{{ selectedAuthors.length }} Authors Selected</span>
      <ui-btn class="btn-edit" @click="openMergeModal" :disabled="selectedAuthors.length !== 2">Merge</ui-btn>
      <ui-btn class="btn-edit" @click="openMakeAliasModal" :disabled="selectedAuthors.length !== 2">Make Alias</ui-btn>
      <ui-btn class="btn-delete" @click="deleteAuthors">Remove</ui-btn>
    </div>

    <div id="bookshelf" class="w-full h-full p-8e overflow-y-auto" :style="{ fontSize: sizeMultiplier + 'rem' }">
      <widgets-cover-size-widget class="fixed right-4 z-50" :style="{ bottom: streamLibraryItem ? '181px' : '16px' }" />
      <div class="flex flex-wrap justify-center">
        <template v-for="author in authorsSorted">

          <div :key="author.id" class="author-card-container p-3e relative" :class="{ 'highlight-border': selectedAuthors.includes(author.id) }" :data-author-id="author.id">

            <div v-if="selectedAuthors.includes(author.id)" class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 pointer-events-none" />

            <cards-author-card :author="author" @edit="editAuthor" @select="handleSelect" />
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
      selectedAuthors: [],
      isMergeModalVisible: false,
      isMakeAliasModalVisible: false,
      isSelectionMode: false
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
    toggleHighlightBorder(show) {
      const selectedCards = document.querySelectorAll('.highlight-border')
      selectedCards.forEach((card) => {
        card.style.display = show ? 'block' : 'none'
      })
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
      this.$store.commit('globals/showEditAuthorModal', author)
    },
    async handleSelect({ author, isSelected }) {
      console.log('author id:' + author.id + ' Select state:' + isSelected)
      if (isSelected) {
        if (!this.selectedAuthors.some((selectedAuthor) => selectedAuthor.id === author.id)) {
          const alias = await this.fetchAuthorAlias(author.id)
          author.alias = alias || []

          this.selectedAuthors.push(author)
        }
      } else {
        this.selectedAuthors = this.selectedAuthors.filter((selectedAuthor) => selectedAuthor.id !== author.id)
      }
      console.log(this.selectedAuthors)
      this.isSelectionMode = this.selectedAuthors.length > 0

      this.$nextTick(() => {
        const authorCardContainer = document.querySelector(`.author-card-container[data-author-id="${author.id}"]`)

        if (authorCardContainer) {
          if (isSelected) {
            authorCardContainer.classList.add('highlight-border')
          } else {
            authorCardContainer.classList.remove('highlight-border')
          }
        }
      })
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
        return []
      }
    },
    openMergeModal() {
      console.log('authorA:' + this.selectedAuthors[0].name)
      console.log('authorB:' + this.selectedAuthors[1].name)
      this.isMergeModalVisible = true
      console.log(this.isMergeModalVisible)
      this.toggleHighlightBorder(false)
    },
    closeMergeModal() {
      this.isMergeModalVisible = false
      this.toggleHighlightBorder(true)
    },
    openMakeAliasModal() {
      this.isMakeAliasModalVisible = true
    },
    closeMakeAliasModal() {
      this.isMakeAliasModalVisible = false
    },
    async deleteAuthors() {
      const authorIds = this.selectedAuthors.map(author => author.id);

      try {
        await this.$axios.delete(`/api/authors/${authorIds[0]}`, {
          data: { ids: authorIds }
        });

        this.$toast.success('Authors deleted successfully');
      } catch (error) {
        console.error('Failed to delete authors:', error);
        this.$toast.error('Failed to delete authors');
      }
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
.toolbar {
  background-color: #1e1e1e; /* 与 Library 页面的工具栏样式一致 */
  height: auto;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 100; /* 确保层级足够高 */
  position: relative;
}

.btn-edit,
.btn-delete {
  border-radius: 4px;
  padding: 8px 16px;
  margin: 0 8px;
  position: relative;
  z-index: 101;
}

.btn-edit {
  background-color: orange;
  color: #fff;
}
.author-card-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.btn-delete {
  background-color: red;
  color: #fff;
}

.highlight-border {
  border: 2px solid rgba(182, 182, 123, 0.884);
  border-radius: 8px;
  position: relative;
}

.highlight-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #4b4a4aca;

  pointer-events: none;
  border-radius: 8px;
}

.fixed {
  position: fixed;
}

.top-16 {
  top: 64px;
}

.right-4 {
  right: 16px;
}

.shadow-lg {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
