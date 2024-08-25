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
    },
    metadata: {
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

      const targetAuthor = direction === 'AtoB' ? this.authorB : this.authorA
      const aliasOfAuthor = direction === 'AtoB' ? this.authorA : this.authorB

      if (aliasOfAuthor.is_alias_of) {
        const confirmOverride = confirm(`Author ${aliasOfAuthor.name} is already an alias of another author. Do you want to override this alias relationship?`)
        if (!confirmOverride) {
          return
        }
      }

      if (!targetAuthor || !aliasOfAuthor) {
        console.error('Failed to set targetAuthor or aliasOfAuthor correctly.')
        this.$toast.error('Failed to set the target author or alias author.')
        return
      }
      console.log('Target Author:', targetAuthor)
      console.log('Alias Of Author:', aliasOfAuthor)

      try {
        const token = this.userToken
        const headers = {
          Authorization: `Bearer ${token}`
        }

        const payload = {
          name: targetAuthor.name,
          asin: targetAuthor.asin,
          description: targetAuthor.description,
          alias: targetAuthor.alias,
          is_alias_of: aliasOfAuthor.id
        }
        console.log('Sending alias payload:', payload)

        const response = await this.$axios.patch(`/api/authors/${targetAuthor.id}`, payload, { headers })
        console.log('Alias creation successful:', response.data)

        this.$toast.success(`Alias created successfully: ${direction}`)
        this.$emit('make-alias', response.data)
        this.close()
      } catch (error) {
        this.$toast.error('Failed to make alias')
        console.error('Make alias error:', error)
      }
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
