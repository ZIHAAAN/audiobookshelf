<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <h2 class="modal-title">Make Alias</h2>
      <div class="author-sections">
        <div class="author-left">
          <div class="author-details">
            <div class="author-image-container">
              <covers-author-image :author="authorA" :default-image="defaultImage" />
            </div>
            <div class="author-info">
              <p id="author-info-name"><strong>Name:</strong> {{ authorA.name }}</p>
              <p><strong>ASIN:</strong> {{ authorA.asin }}</p>
              <p><strong>Description:</strong> {{ authorA.description }}</p>
              <p class="alias-text"><strong>Alias:</strong> {{ authorB.name }}</p>
            </div>
          </div>
          <ui-btn type="button" color="success" class="mt-5" @click="makeAlias('AtoB')">Make {{ authorB.name }} as {{ authorA.name }}'s alias</ui-btn>
        </div>

        <div class="author-right">
          <div class="author-details">
            <div class="author-info">
              <p id="author-info-name"><strong>Name:</strong> {{ authorB.name }}</p>
              <p><strong>ASIN:</strong> {{ authorB.asin }}</p>
              <p><strong>Description:</strong> {{ authorB.description }}</p>
              <p class="alias-text"><strong>Alias:</strong> {{ authorA.name }}</p>
            </div>
            <div class="author-image-container">
              <covers-author-image :author="authorB" :default-image="defaultImage" />
            </div>
          </div>
          <ui-btn type="button" color="success" class="mt-5" @click="makeAlias('AtoB')">Make {{ authorA.name }} as {{ authorB.name }}'s alias</ui-btn>
        </div>
      </div>

      <div class="modal-actions">
        <ui-btn type="button" @click="close">Cancel</ui-btn>
      </div>
    </div>
  </div>
</template>

<script>
import CoversAuthorImage from '@/components/covers/AuthorImage.vue'

export default {
  components: {
    CoversAuthorImage
  },
  props: {
    authorA: {
      type: Object,
      required: true
    },
    authorB: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedAuthor: 'A',
      mergedAuthor: {
        name: this.authorA.name,
        imagePath: this.authorA.imagePath,
        asin: this.authorA.asin,
        description: this.authorA.description,
        alias: [],
        id: this.authorB.id
      },
      selectedImage: 'A',
      selectedASIN: 'A',
      selectedDescription: 'A',
      selectedAliasA: {},
      selectedAliasB: {},
      defaultImage: '/path/to/default-image.png'
    }
  },
  computed: {
    userToken() {
      return this.$store.getters['user/getToken']
    }
  },
  mounted() {
    // this.setDefaultAuthor()
    // this.swapAuthorIds()
  },
  methods: {
    async makeAlias(direction) {
      console.log(`Making alias: ${direction}`)

      if (direction !== 'AtoB' && direction !== 'BtoA') {
        this.$toast.error('Invalid direction for alias creation')
        return
      }
      console.log('Author A:', this.authorA)
      console.log('Author B:', this.authorB)

      const targetAuthor = direction === 'AtoB' ? this.authorB : this.authorA //B
      const aliasOfAuthor = direction === 'AtoB' ? this.authorA : this.authorB //A

      const token = this.userToken
      const headers = {
        Authorization: `Bearer ${token}`
      }

      try {
        if (targetAuthor.is_alias_of && aliasOfAuthor.is_alias_of) {
          const originalAuthorA = await this.$axios.$get(`/api/authors/${targetAuthor.is_alias_of}`).catch((error) => {
            console.error('Failed to get author', error)
            return null
          })

          const originalAuthorB = await this.$axios.$get(`/api/authors/${aliasOfAuthor.is_alias_of}`).catch((error) => {
            console.error('Failed to get author', error)
            return null
          })

          // const confirmBothOverride = confirm(`Both ${targetAuthor.name} and ${aliasOfAuthor.name} are already aliases of other authors (${originalAuthorA ? originalAuthorA.name : 'another author'} and ${originalAuthorB ? originalAuthorB.name : 'another author'}). Do you want to unlink their relationships and overwrite this alias relationship?`)

          // if (confirmBothOverride) {
          //   await this.removeAlias(targetAuthor, headers)
          //   await this.removeAlias(aliasOfAuthor, headers)
          // } else {
          //   return // 用户选择取消，不进行任何操作
          // }
          const payload = {
            message: `Both ${targetAuthor.name} and ${aliasOfAuthor.name} are already aliases of other authors (${originalAuthorA ? originalAuthorA.name : 'another author'} and ${originalAuthorB ? originalAuthorB.name : 'another author'}). Do you want to unlink their relationships and overwrite this alias relationship?`,
            type: 'yesNo',
            callback: async (confirmed) => {
              if (confirmed) {
                await this.removeAlias(targetAuthor, headers)
                await this.removeAlias(aliasOfAuthor, headers)
                await this.setAlias(targetAuthor, aliasOfAuthor, headers)
                this.$toast.success(`Alias created successfully: ${aliasOfAuthor.name} as ${targetAuthor.name}'s alias`)
                this.$emit('make-alias-merge')
              }
            }
          }
          this.$store.commit('globals/setConfirmPrompt', payload)
          //1.B 已经是别人的 alias
        } else if (targetAuthor.is_alias_of) {
          const originalAuthor = await this.$axios.$get(`/api/authors/${targetAuthor.is_alias_of}?`).catch((error) => {
            console.error('Failed to get author', error)
            return null
          })

          // const confirmOverride = confirm(`Author ${targetAuthor.name} is already an alias of ${originalAuthor ? originalAuthor.name : 'another author'}. Do you want to unlink their relationship and overwrite this alias relationship?`)
          // if (confirmOverride) {
          //   await this.removeAlias(targetAuthor, headers)
          // } else {
          const payload = {
            message: `Author ${targetAuthor.name} is already an alias of ${originalAuthor ? originalAuthor.name : 'another author'}. Do you want to unlink their relationship and overwrite this alias relationship?`,
            type: 'yesNo',
            callback: async (confirmed) => {
              if (confirmed) {
                await this.removeAlias(targetAuthor, headers)
                await this.setAlias(targetAuthor, aliasOfAuthor, headers)
                this.$toast.success(`Alias created successfully: ${aliasOfAuthor.name} as ${targetAuthor.name}'s alias`)
                this.$emit('make-alias-merge')
              }
            }
          }
          this.$store.commit('globals/setConfirmPrompt', payload)
          // return // dont choice ,return
          // 情况2：A 已经是别人的 alias
        } else if (aliasOfAuthor.is_alias_of) {
          const originalAuthor = await this.$axios.$get(`/api/authors/${aliasOfAuthor.is_alias_of}?`).catch((error) => {
            console.error('Failed to get author', error)
            return null
          })

          // const confirmOverrideAlias = confirm(`Author ${aliasOfAuthor.name} is already an alias of ${originalAuthor ? originalAuthor.name : 'another author'}. Do you want to unlink their relationship and overwrite this alias relationship?`)
          // if (confirmOverrideAlias) {
          //   await this.removeAlias(aliasOfAuthor, headers)
          // } else {
          const payload = {
            message: `Author ${aliasOfAuthor.name} is already an alias of ${originalAuthor ? originalAuthor.name : 'another author'}. Do you want to unlink their relationship and overwrite this alias relationship?`,
            type: 'yesNo',
            callback: async (confirmed) => {
              if (confirmed) {
                await this.removeAlias(aliasOfAuthor, headers)
                await this.setAlias(targetAuthor, aliasOfAuthor, headers)
                this.$toast.success(`Alias created successfully: ${aliasOfAuthor.name} as ${targetAuthor.name}'s alias`)
                this.$emit('make-alias-merge')
              }
            }
          }

          this.$store.commit('globals/setConfirmPrompt', payload)
          // return
        } else {
          await this.setAlias(targetAuthor, aliasOfAuthor, headers)
          this.$toast.success(`Alias created successfully: ${aliasOfAuthor.name} as ${targetAuthor.name}'s alias`)
          this.$emit('make-alias-merge')
        }
      } catch (error) {
        // 最后，将 A 设置为 B 的 alias（或反之，取决于 direction）
        //   await this.setAlias(targetAuthor, aliasOfAuthor, headers)
        //   this.$toast.success(`Alias created successfully: ${aliasOfAuthor.name} as ${targetAuthor.name}'s alias`)
        //   this.$emit('make-alias-merge')
        // } catch (error) {
        //   this.$toast.error('Failed to set alias')
        //   console.error('Error setting alias:', error)
        // }
        this.$toast.error('Failed to set alias')
        console.error('Error setting alias:', error)
      }

      this.close()
    },
    async removeAlias(author, headers) {
      const payloadRemoveAlias = {
        name: author.name,
        asin: author.asin,
        description: author.description,
        alias: author.alias,
        is_alias_of: null // 将 alias 关系解除
      }
      console.log(`Removing alias relationship for ${author.name}`)
      await this.$axios.patch(`/api/authors/${author.id}`, payloadRemoveAlias, { headers })
    },

    async setAlias(targetAuthor, aliasOfAuthor, headers) {
      const payloadSetAlias = {
        name: targetAuthor.name,
        asin: targetAuthor.asin,
        description: targetAuthor.description,
        alias: targetAuthor.alias,
        is_alias_of: aliasOfAuthor.id // 将 alias 设置为新的 id
      }
      console.log(`Setting alias for ${targetAuthor.name} as ${aliasOfAuthor.name}'s alias`)
      await this.$axios.patch(`/api/authors/${targetAuthor.id}`, payloadSetAlias, { headers })
    },
    close() {
      // if (this.selectedAuthorPair && this.selectedAuthorPair.metadata && this.selectedAuthorPair.metadata.notificationId) {
      //   const notificationId = this.selectedAuthorPair.metadata.notificationId
      //   this.clearNotifications(notificationId)
      // }
      this.isMakeAliasModalVisible = false
      this.selectedAuthorPair = null
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  background-color: #1a1a1a;
  padding: 20px;
  border-radius: 10px;
  width: 70%;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.modal-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.author-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  padding: 20px;
  align-items: center;
}

.author-details {
  display: flex;
  justify-content: space-around;
  align-content: stretch;
}

.author-left,
.author-right {
  background-color: rgba(207, 207, 207, 0.1);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.author-info,
.author-image-container {
  padding: 20px;
}

.modal-actions {
  text-align: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #333;
  position: relative;
}

.author-image-container {
  background-size: cover;
  background-position: center;
  width: 150px;
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
}

.alias-text {
  font-size: 19px;
  color: #ede6cd;
}
</style>
