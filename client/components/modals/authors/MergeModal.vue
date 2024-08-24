<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <h2 class="modal-title">Merge Authors</h2>

      <div class="merge-layout">
        <div class="author-section author-left">
          <h3>{{ authorA.name }}</h3>
          <div class="author-details">
            <label>
              <span>
                <div class="author-image-container">
                  <covers-author-image :author="authorA" :default-image="defaultImage" />
                </div>
              </span>
              <input type="radio" class="option-input" name="image" v-model="selectedImage" value="A" @change="updateMergedAuthorImage('A')" />
            </label>
            <label>
              <span>Name: {{ authorA.name }}</span>
              <input type="radio" class="option-input" name="name" v-model="selectedAuthor" value="A" @change="updateMergedAuthorName('A')" />
            </label>
            <label>
              <span>ASIN: {{ authorA.asin }}</span>
              <input type="radio" class="option-input" name="asin" v-model="selectedASIN" value="A" @change="updateMergedAuthorASIN('A')" />
            </label>
            <label>
              <span>Description: {{ authorA.description }}</span>
              <input type="radio" class="option-input" name="description" v-model="selectedDescription" value="A" @change="updateMergedAuthorDescription('A')" />
            </label>
            <label v-for="(alias, index) in authorA.alias" :key="index">
              <span>Alias: {{ alias.name || alias }}</span>
              <input type="checkbox" :name="'aliasA' + index" v-model="selectedAliasA[index]" :value="alias.name || alias" @change="updateMergedAuthorAlias('A', index)" />
            </label>
          </div>
        </div>


        <div class="merged-author-section">
          <h2>Combination</h2>
          <div class="author-details">
            <div class="author-image-container">
              <covers-author-image :author="mergedAuthor" :default-image="defaultImage" />
            </div>
            <div class="author-info">
              <p>Name: {{ mergedAuthor.name }}</p>
              <p>ASIN: {{ mergedAuthor.asin }}</p>
              <p>Description: {{ mergedAuthor.description }}</p>
              <p>Alias: {{ mergedAuthor.alias.join(', ') }}</p>
            </div>
          </div>
        </div>

        <div class="author-section author-right">
          <h3>{{ authorB.name }}</h3>
          <div class="author-details">
            <label class="image-label">
              <input type="radio" class="option-input" name="image" v-model="selectedImage" value="B" @change="updateMergedAuthorImage('B')" />
              <div class="author-image-container">
                <covers-author-image :author="authorB" :default-image="defaultImage" />
              </div>
            </label>
            <label>
              <input type="radio" class="option-input" name="name" v-model="selectedAuthor" value="B" @change="updateMergedAuthorName('B')" />
              Name: {{ authorB.name }}
            </label>
            <label>
              <input type="radio" class="option-input" name="asin" v-model="selectedASIN" value="B" @change="updateMergedAuthorASIN('B')" />
              ASIN: {{ authorB.asin }}
            </label>
            <label>
              <input type="radio" class="option-input" name="description" v-model="selectedDescription" value="B" @change="updateMergedAuthorDescription('B')" />
              Description: {{ authorB.description }}
            </label>
            <label v-for="(alias, index) in authorB.alias" :key="index">
              <input type="checkbox" :name="'aliasB' + index" v-model="selectedAliasB[index]" :value="alias.name || alias" @change="updateMergedAuthorAlias('B', index)" />
              Alias: {{ alias.name || alias }}
            </label>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <!--TODO: add merge function to merge button-->
        <button class="btn btn-primary">Merge</button>
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
  },
  methods: {
    setDefaultAuthor() {
      this.updateMergedAuthorName(this.selectedAuthor)
      this.updateMergedAuthorImage(this.selectedAuthor)
      this.updateMergedAuthorASIN(this.selectedAuthor)
      this.updateMergedAuthorDescription(this.selectedAuthor)

      for (let index = 0; index < this.authorA.alias.length; index++) {
        this.updateMergedAuthorAlias(this.selectedAuthor, index)
      }
    },
    updateMergedAuthorName(author) {
      this.mergedAuthor.name = author === 'A' ? this.authorA.name : this.authorB.name
      this.mergedAuthor.id = author === 'A' ? this.authorA.id : this.authorB.id // 更新 id
    },
    updateMergedAuthorImage(author) {
      this.mergedAuthor.imagePath = author === 'A' ? this.authorA.imagePath : this.authorB.imagePath
    },
    updateMergedAuthorASIN(author) {
      this.mergedAuthor.asin = author === 'A' ? this.authorA.asin : this.authorB.asin
    },
    updateMergedAuthorDescription(author) {
      this.mergedAuthor.description = author === 'A' ? this.authorA.description : this.authorB.description
    },
    updateMergedAuthorAlias(author, index) {
      if (author === 'A') {
        this.$set(this.selectedAliasA, index, this.authorA.alias[index].name || this.authorA.alias[index])
      } else {
        this.$set(this.selectedAliasB, index, this.authorB.alias[index].name || this.authorB.alias[index])
      }
      this.mergedAuthor.alias = [...new Set([...Object.values(this.selectedAliasA), ...Object.values(this.selectedAliasB)])]
    },
    async mergeAuthors() {
      console.log('Merging authors')
      console.log('Author A:', this.authorA)
      console.log('Author B:', this.authorB)
      console.log('Merged Author:', this.mergedAuthor)

      console.log('Payload before sending:', {
        id: this.mergedAuthor.id,
        name: this.mergedAuthor.name,
        asin: this.mergedAuthor.asin,
        description: this.mergedAuthor.description,
        alias: [...new Set([...this.authorA.alias, ...this.authorB.alias])],
        is_alias_of: null
      })
      console.log('Selected Author A ID:', this.authorA.id)
      console.log('Selected Author B ID:', this.authorB.id)
      console.log('Merged Author ID:', this.mergedAuthor.id)
      console.log('Merged Author Name:', this.mergedAuthor.name)

      try {
        const token = this.userToken
        console.log('this.userToken', this.userToken)
        const headers = {
          Authorization: `Bearer ${token}`
        }
        const payload = {
          id: this.mergedAuthor.id,
          name: this.authorA.name,
          asin: this.mergedAuthor.asin,
          description: this.mergedAuthor.description,
          alias: [...new Set([...this.authorA.alias, ...this.authorB.alias])], // 合并两个作者的别名
          is_alias_of: null
        }

        console.log('Sending merge payload:', payload)
        console.log('Target Author ID for merge:', this.mergedAuthor.id)
        const response = await this.$axios.patch(`/api/authors/${this.mergedAuthor.id}`, payload, { headers })
        console.log('Merge successful:', response.data)

        this.$toast.success('Authors merged successfully')
        this.$emit('merge', response.data)
        this.close()
      } catch (error) {
        this.$toast.error('Failed to merge authors')
        console.error('Merge error:', error)
      }
    },
    close() {
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

.merge-layout {
  display: grid;
  grid-template-columns: 2fr 3fr 2fr;
  grid-gap: 20px;
  padding: 20px;
  align-items: center;
}

.image-label {
  display: flex;
  flex-direction: row;
  align-items: start;
}

.author-section,
.merged-author-section {
  text-align: center;
  background-color: rgba(207, 207, 207, 0.1);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.author-left .author-details {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.author-right .author-details {
  display: flex;
  flex-direction: column;
  align-items: end;
}

.author-details label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
}

.author-left .author-details label span {
  flex-grow: 1;
  text-align: left;
}

.author-left .author-details input {
  margin-left: auto;
}

.author-right .author-details label span {
  flex-grow: 1;
  text-align: right;
}

.author-right .author-details input {
  margin-right: auto;
}

.merged-author-section .author-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.merged-author-section h2 {
  text-align: center;
  margin-bottom: 10px;
  font-size: 30px;
}

.merged-author-section .author-image-container {
  width: 150px;
  height: 150px;
  flex: 0 0 auto;
}

.author-info {
  flex: 1;
}

.author-info p {
  padding: 5px;
  font-size: 20px;
}

.modal-actions {
  text-align: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #333;
  position: relative;
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
  margin-left: 10px;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.author-image-container {
  background-size: cover;
  background-position: center;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
}

.option-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  position: relative;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 20px;
  width: 20px;
  border-radius: 5px;
  -webkit-transition: all 0.15s ease-out 0s;
  -moz-transition: all 0.15s ease-out 0s;
  transition: all 0.3s ease-out 0s;
  background: rgba(225, 225, 225, 0.75);
  border: none;
  color: #fff;
  cursor: pointer;
  display: inline-block;
  outline: none;
  margin-right: 0.5rem;
  z-index: 1000;
}

.option-input:hover {
  background: rgba(174, 174, 174, 0.8);
}

.option-input:checked {
  background: #2c2c2c;
}

.option-input:checked::before {
  height: 20px;
  width: 20px;
  border-radius: 5px;
  position: absolute;
  content: "›";
  display: inline-block;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  padding-bottom: 1px;
  line-height: 20px;
}

.author-right .option-input:checked::before {
  content: "‹";
}

.option-input:checked::after {
  background: #2c2c2c;
  content: "";
  display: block;
  position: relative;
  z-index: 100;
}

</style>
