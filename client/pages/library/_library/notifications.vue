<template >
  <div id="page-wrapper" class="bg-bg page overflow-y-auto p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl mb-4 text-center">Similar Authors Detected</h1>

      <p class="text-center mb-6">The following authors are detected as similar. Do you want to merge them?</p>
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div v-for="(authorPair, index) in authorPairs" :key="index" :class="['notification', authorPair.metadata.handled ? 'read' : 'unread']" class="notification bg-card p-4 rounded-lg shadow-lg flex flex-col items-center w-full">
          <div class="flex justify-around w-full m-3 p5 author-container space-x-4">
            <!-- <AuthorCard v-for="author in [authorPair.authorA, authorPair.authorB]" :key="author.id" :author="author" :width="cardWidth" :height="cardHeight" @edit="editAuthor" /> -->
            <!-- category : aliasAuthor or possibleAuthor -->
            <template v-if="authorPair.metadata.category === 'merge' || authorPair.metadata.category === 'Possible Author'">
              <AuthorCard v-for="author in [authorPair.authorA, authorPair.authorB]" :key="author.id" :author="author" :width="cardWidth" :height="cardHeight" @edit="editAuthor" />
            </template>
          </div>
          <div class="flex justify-center space-x-4 w-full mt-4">
            <button class="btn btn-primary" @click="showMergeModal(authorPair)">Merge</button>
            <button class="btn btn-primary" @click="showMakeAliasModal(authorPair)">Make Alias</button>
            <button class="btn btn-secondary" @click="cancelNotification(authorPair.metadata.notificationId)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    <merge-author-modal v-if="isMergeModalVisible" :authorA="selectedAuthorPair.authorA" :authorB="selectedAuthorPair.authorB" :isPossibleAuthor="isPossibleAuthor" :notificationId="selectedAuthorPair.metadata.notificationId" :shouldClearNotification="true" @close="closeMergeModal" @merge="handleMerge" />
    <make-alias-modal v-if="isMakeAliasModalVisible" :authorA="selectedAuthorPair.authorA" :authorB="selectedAuthorPair.authorB" @close="closeMakeAliasModal" @alias="handleMakeAlias" />
  </div>
</template>

<script>
import AuthorCard from '@/components/cards/AuthorCard.vue'
import MergeAuthorModal from '@/components/modals/authors/MergeModal.vue'
import MakeAliasModal from '@/components/modals/authors/MakeAliasModal.vue'

export default {
  async asyncData({ store, redirect, params, $axios }) {
    const token = store.getters['user/getToken']
    const userId = params.library

    console.log('params:', params)
    console.log('userId:', userId)

    if (!token) {
      return redirect('/login')
    }

    try {
      const notifications = await $axios.$get('/api/getNotifications', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { userId }
      })

      const authorPairs = await Promise.all(
        notifications.map(async (notification) => {
          console.log('Notification Category:', notification.category)
          const authorA = {
            id: notification.author.id,
            name: notification.author.name,
            asin: notification.author.asin,
            description: notification.author.description,
            imagePath: notification.author.imagePath,
            alias: [],
            libraryId: notification.author.libraryId,
            is_alias_of: notification.author.is_alias_of
          }
          let authorB

          if (notification.category === 'merge') {
            console.log('Handling merge category')
            authorB = {
              id: notification.aliasAuthor.id,
              name: notification.aliasAuthor.name,
              asin: notification.aliasAuthor.asin,
              description: notification.aliasAuthor.description,
              imagePath: notification.aliasAuthor.imagePath,
              alias: [],
              libraryId: notification.aliasAuthor.libraryId,
              is_alias_of: notification.aliasAuthor.is_alias_of
            }
          } else if (notification.category === 'Possible Author') {
            console.log('Handling Possible Author category')
            authorB = {
              id: notification.possibleAuthor.id,
              name: notification.possibleAuthor.name,
              asin: notification.possibleAuthor.asin,
              description: notification.possibleAuthor.description,
              imagePath: notification.possibleAuthor.imagePath,
              alias: [],
              libraryId: notification.possibleAuthor.libraryId,
              is_alias_of: notification.possibleAuthor.is_alias_of
            }
          }
          console.log('authorA:', authorA)
          console.log('authorB:', authorB)
          if (!authorA.is_alias_of) {
            authorA.alias = await $axios.$get(`/api/authors/${authorA.id}/alias`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          }

          if (!authorB.is_alias_of) {
            authorB.alias = await $axios.$get(`/api/authors/${authorB.id}/alias`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          }

          return {
            authorA,
            authorB,
            metadata: {
              handled: notification.handled || false,
              read: notification.read || false,
              notificationId: notification.notificationId,
              category: notification.category // 传递 category 信息
            }
          }
        })
      )
      return { authorPairs }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return { authorPairs: [] }
    }
  },
  components: {
    AuthorCard,
    MergeAuthorModal,
    MakeAliasModal
  },
  data() {
    return {
      authorPairs: [],
      isMergeModalVisible: false,
      isMakeAliasModalVisible: false,
      selectedAuthorPair: null,
      isPossibleAuthor: false,
      isHovering: {},
      searching: false,
      nameBelow: false,
      cardWidth: 150,
      cardHeight: 200
    }
  },
  computed: {
    hasUnreadNotifications() {
      return this.authorPairs.some((pair) => {
        const handled = pair?.metadata?.handled
        return !handled
      })
    },
    userToken() {
      return this.$store.getters['user/getToken']
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    libraryProvider() {
      return this.$store.getters['libraries/getLibraryProvider'](this.currentLibraryId) || 'google'
    },
    sizeMultiplier() {
      return this.$store.getters['user/getSizeMultiplier']
    }
  },
  methods: {
    async fetchAuthorPairs(isRead = false) {
      try {
        const token = this.userToken

        const response = await this.$axios.get('/api/getNotifications', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: { isRead }
        })
        console.log('----------isRead------------', isRead, response)
        this.authorPairs = await Promise.all(
          response.data.map(async (notification) => {
            const authorA = {
              id: notification.author.id,
              name: notification.author.name,
              asin: notification.author.asin,
              description: notification.author.description,
              imagePath: notification.author.imagePath,
              alias: [],
              libraryId: notification.author.libraryId,
              is_alias_of: notification.author.is_alias_of
            }
            let authorB

            if (notification.category === 'merge') {
              authorB = {
                id: notification.aliasAuthor.id,
                name: notification.aliasAuthor.name,
                asin: notification.aliasAuthor.asin,
                description: notification.aliasAuthor.description,
                imagePath: notification.aliasAuthor.imagePath,
                alias: [],
                libraryId: notification.aliasAuthor.libraryId,
                is_alias_of: notification.aliasAuthor.is_alias_of
              }
            } else if (notification.category === 'Possible Author') {
              authorB = {
                id: notification.possibleAuthor.id,
                name: notification.possibleAuthor.name,
                asin: notification.possibleAuthor.asin,
                description: notification.possibleAuthor.description,
                imagePath: notification.possibleAuthor.imagePath,
                alias: [],
                libraryId: notification.possibleAuthor.libraryId,
                is_alias_of: notification.possibleAuthor.is_alias_of
              }
            }
            if (!authorA.is_alias_of) {
              authorA.alias = await this.fetchAuthorAlias(authorA.id)
            }

            if (!authorB.is_alias_of) {
              authorB.alias = await this.fetchAuthorAlias(authorB.id)
            }

            return {
              authorA,
              authorB,
              metadata: {
                handled: notification.handled || false,
                read: notification.read || false,
                notificationId: notification.notificationId,
                category: notification.category
              }
            }
          })
        )
      } catch (error) {
        console.error('Failed to fetch author pairs:', error)
      }
    },

    async fetchAuthorAlias(authorId) {
      try {
        const token = this.userToken
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

    editAuthor(author) {
      this.$store.commit('globals/showEditAuthorModal', author)
    },

    showMergeModal(authorPair) {
      if (!authorPair || !authorPair.authorA || !authorPair.authorB) {
        console.error('Invalid authorPair data:', authorPair)
        return
      }
      // console.log('selectedAuthorPair.metadata:', authorPair.metadata)
      this.selectedAuthorPair = authorPair
      this.isPossibleAuthor = authorPair.metadata.category === 'Possible Author'
      this.isMergeModalVisible = true
    },

    closeMergeModal() {
      this.isMergeModalVisible = false
      this.selectedAuthorPair = null
    },

    showMakeAliasModal(authorPair) {
      this.selectedAuthorPair = authorPair
      this.isMakeAliasModalVisible = true
      if (authorPair.metadata && authorPair.metadata.notificationId) {
        this.notificationId = authorPair.metadata.notificationId
      } else {
        this.notificationId = null
      }
    },

    closeMakeAliasModal() {
      this.isMakeAliasModalVisible = false
      this.selectedAuthorPair = null
    },

    async handleMerge() {
      this.selectedAuthorPair.metadata.handled = true
      if (notificationId) {
        this.authorPairs = this.authorPairs.filter((pair) => pair.metadata.notificationId !== notificationId)
      }
      this.authorPairs = [...this.authorPairs]
      this.isMergeModalVisible = false
    },

    async handleMakeAlias() {
      this.selectedAuthorPair.metadata.handled = true
      if (notificationId) {
        this.authorPairs = this.authorPairs.filter((pair) => pair.metadata.notificationId !== notificationId)
      }
      this.authorPairs = [...this.authorPairs]
      this.isMakeAliasModalVisible = false
    },

    markNotificationAsHandled(authorPair) {
      authorPair.forEach((author) => {
        author.handled = true
      })
      this.authorPairs = [...this.authorPairs]
    },
    async cancelNotification(notificationId) {
      try {
        const token = this.userToken
        await this.$axios.get('/api/clearNotifications', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: { notificationId }
        })
        console.log('Notification ID being sent:', notificationId)
        this.authorPairs = this.authorPairs || []
        this.authorPairs = this.authorPairs.filter((pair) => pair.metadata.notificationId !== notificationId)
      } catch (error) {
        console.error('Failed to clear notification:', error)
      }
    }

    // async cancelNotification() {
    // if (authorPairToCancel && authorPairToCancel.metadata && authorPairToCancel.metadata.notificationId) {
    //   const notificationId = authorPairToCancel.metadata.notificationId
    //   await this.clearNotifications(notificationId)
    // }
    // this.authorPairs = this.authorPairs.filter((pair) => pair.metadata.notificationId !== authorPairToCancel.metadata.notificationId)
    //await this.clearNotifications(this.metadata.notificationId)

    //   this.close()
    // }
  },

  mouseover(index) {
    this.$set(this.isHovering, index, true)
  },

  mouseleave(index) {
    this.$set(this.isHovering, index, false)
  },

  async searchAuthor(author) {
    this.searching = true
    const payload = {}

    if (author.asin) payload.asin = author.asin
    else payload.q = author.name

    payload.region = this.libraryProvider.startsWith('audible.') ? this.libraryProvider.split('.').pop() : 'us'

    const response = await this.$axios.$post(`/api/authors/${author.id}/match`, payload).catch((error) => {
      console.error('Failed', error)
      return null
    })

    if (!response) {
      this.$toast.error(`Author ${author.name} not found`)
    } else if (response.updated) {
      this.$toast.success(`Author ${response.author.name} was updated`)
    } else {
      this.$toast.info(`No updates were made for Author ${response.author.name}`)
    }

    this.searching = false
  },
  close() {
    this.isMergeModalVisible = false
    this.selectedAuthorPair = null
    this.$emit('close')
  },

  mounted() {
    this.fetchAuthorPairs()
  },
  beforeDestroy() {
    this.authorPairs.forEach((authorPair) => {
      this.$eventBus.$off(`searching-author-${authorPair[0].id}`, this.setSearching)
      this.$eventBus.$off(`searching-author-${authorPair[1].id}`, this.setSearching)
    })
  }
}
</script>

<style scoped>
#page-wrapper {
  background-color: #1a1a1a;
  color: #ffffff;
}

.bg-card {
  background-color: #2c2c2c;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.author-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  overflow: visible;
}

.AuthorCard {
  flex: 0 1 calc(50% - 20px);
  max-width: calc(50% - 10px);
  margin: 0 5px;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #6b7280;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.text-center {
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  justify-content: center;
}

.notification {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #2c2c2c;
  padding: 20px;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  overflow: hidden;
}

img {
  border-radius: 0.5rem;
}
#page-wrapper {
  padding: 20px;
}

.grid {
  gap: 10px;
}
</style>
