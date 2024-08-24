<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <h2 class="modal-title">Make Alias</h2>
      <div class="author-sections">
        <!-- Author A Section -->
        <div class="author-section">
          <h3>{{ authorA.name }}</h3>
          <div class="author-image-container">
            <covers-author-image :author="authorA" :default-image="defaultImage" />
          </div>
          <button class="btn btn-make-alias mt-2" @click="makeAlias('AtoB')">Make A to B's Alias</button>
        </div>

        <!-- Author B Section -->
        <div class="author-section">
          <h3>{{ authorB.name }}</h3>
          <div class="author-image-container">
            <covers-author-image :author="authorB" :default-image="defaultImage" />
          </div>
          <button class="btn btn-make-alias mt-2" @click="makeAlias('BtoA')">Make B to A's Alias</button>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" @click="close">Cancel</button>
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
        name: '',
        imagePath: '',
        asin: '',
        description: '',
        alias: []
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
    this.setDefaultAuthor()
    this.swapAuthorIds()
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
      this.$emit('close');
    }
  }
};
</script>
