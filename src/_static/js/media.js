// Media bundle - combines image optimization and lazy loading
import { ImageOptimizer } from './image-optimization.js';

export default class MediaBundle {
  static init() {
    // Initialize image optimization and lazy loading
    const imageOptimizer = new ImageOptimizer();
    imageOptimizer.init();
  }
}