import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import { Product } from '@/types'

interface MatchResult {
  product: Product
  confidence: number
}

class ImageMatcher {
  private model: mobilenet.MobileNet | null = null
  private productEmbeddings: Map<number, number[]> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    try {
      await tf.ready()
      this.model = await mobilenet.load({
        version: 2,
        alpha: 0.5, // Use smaller model for faster inference
      })
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize ImageMatcher:', error)
      throw error
    }
  }

  /**
   * Extract feature embedding from an image element
   */
  private async getEmbedding(imageElement: HTMLImageElement): Promise<number[]> {
    if (!this.model) throw new Error('Model not initialized')

    // Use the model's built-in infer method which is more stable
    const embedding = await this.model.infer(imageElement, true) as tf.Tensor
    const flattened = embedding.flatten()
    const normalizedEmbedding = tf.div(flattened, tf.norm(flattened))
    const embeddingArray = await normalizedEmbedding.data()

    // Clean up tensors
    embedding.dispose()
    flattened.dispose()
    normalizedEmbedding.dispose()

    return Array.from(embeddingArray)
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (normA * normB)
  }

  /**
   * Register product images for matching
   */
  async registerProducts(products: Product[]): Promise<void> {
    if (!this.initialized) await this.initialize()

    console.log('Registering', products.length, 'products for image matching') // Debug log

    const loadPromises = products.map(async (product) => {
      if (!product.photo_url) {
        console.log('Product', product.id, 'has no photo, skipping')
        return
      }

      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = product.photo_url

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = (err) => {
            console.warn('Failed to load image for product', product.id, ':', err)
            reject(err)
          }
        })

        const embedding = await this.getEmbedding(img)
        this.productEmbeddings.set(product.id, embedding)
        console.log('Successfully registered product', product.id) // Debug log
      } catch (error) {
        console.warn(`Failed to register product ${product.id} image:`, error)
      }
    })

    await Promise.allSettled(loadPromises)
    console.log('Total registered products:', this.productEmbeddings.size) // Debug log
  }

  /**
   * Match a video frame against registered products
   */
  async matchFrame(videoElement: HTMLVideoElement, products: Product[]): Promise<MatchResult[]> {
    if (!this.initialized) await this.initialize()

    // Create image from video frame
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    ctx.drawImage(videoElement, 0, 0)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageDataUrl

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
    })

    const queryEmbedding = await this.getEmbedding(img)

    // Calculate similarity with all registered products
    const matches: MatchResult[] = []
    for (const product of products) {
      const productEmbedding = this.productEmbeddings.get(product.id)
      if (!productEmbedding) continue

      const similarity = this.cosineSimilarity(queryEmbedding, productEmbedding)
      if (similarity > 0.5) { // Minimum confidence threshold
        matches.push({ product, confidence: similarity })
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence)
    return matches
  }

  /**
   * Clear all registered product embeddings
   */
  clear(): void {
    this.productEmbeddings.clear()
  }
}

export const imageMatcher = new ImageMatcher()
export type { MatchResult }
