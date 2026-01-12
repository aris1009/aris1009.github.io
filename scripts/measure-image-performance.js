#!/usr/bin/env node

/**
 * Image Performance Measurement Script
 * Measures Core Web Vitals and image optimization metrics
 */

const fs = require('fs').promises;
const path = require('path');

class ImagePerformanceAnalyzer {
  constructor() {
    this.results = {
      images: [],
      summary: {
        totalImages: 0,
        totalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        formats: {},
        largestImage: null,
        slowestLoadTime: null
      }
    };
  }

  async analyzeBuildDirectory(buildDir = '_site') {
    try {
      await this.scanImages(buildDir);
      this.calculateMetrics();
      await this.generateReport();
    } catch (error) {
      console.error('Error analyzing image performance:', error);
    }
  }

  async scanImages(dir, baseDir = dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        await this.scanImages(fullPath, baseDir);
      } else if (this.isImageFile(item.name)) {
        await this.analyzeImage(fullPath, path.relative(baseDir, fullPath));
      }
    }
  }

  isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext);
  }

  async analyzeImage(filePath, relativePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const imageInfo = {
        path: relativePath,
        size: stats.size,
        format: ext.substring(1), // Remove the dot
        lastModified: stats.mtime,
        width: null,
        height: null
      };

      // Try to get image dimensions
      try {
        const sharp = require('sharp');
        const metadata = await sharp(filePath).metadata();
        imageInfo.width = metadata.width;
        imageInfo.height = metadata.height;
        imageInfo.aspectRatio = metadata.width / metadata.height;
      } catch (error) {
        // Sharp not available or unsupported format
        console.warn(`Could not read metadata for ${filePath}:`, error.message);
      }

      this.results.images.push(imageInfo);
      this.results.summary.totalImages++;
      this.results.summary.totalSize += stats.size;
      
      // Track formats
      if (!this.results.summary.formats[imageInfo.format]) {
        this.results.summary.formats[imageInfo.format] = {
          count: 0,
          totalSize: 0
        };
      }
      this.results.summary.formats[imageInfo.format].count++;
      this.results.summary.formats[imageInfo.format].totalSize += stats.size;
      
      // Track largest image
      if (!this.results.summary.largestImage || stats.size > this.results.summary.largestImage.size) {
        this.results.summary.largestImage = imageInfo;
      }
      
    } catch (error) {
      console.error(`Error analyzing image ${filePath}:`, error);
    }
  }

  calculateMetrics() {
    const { summary } = this.results;
    
    // Calculate compression ratios for optimized images
    const originalImages = this.results.images.filter(img => 
      img.path.includes('/img/') && !img.path.includes('/img/optimized/')
    );
    const optimizedImages = this.results.images.filter(img => 
      img.path.includes('/img/optimized/')
    );

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    originalImages.forEach(original => {
      totalOriginalSize += original.size;
      
      // Find corresponding optimized versions
      const baseName = path.basename(original.path, path.extname(original.path));
      const optimized = optimizedImages.filter(opt => 
        path.basename(opt.path, path.extname(opt.path)).includes(baseName)
      );
      
      optimized.forEach(opt => {
        totalOptimizedSize += opt.size;
      });
    });

    if (totalOriginalSize > 0) {
      summary.compressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2);
    }
    
    summary.optimizedSize = totalOptimizedSize;
  }

  async generateReport() {
    const report = this.formatReport();
    console.log(report);
    
    // Save report to file
    await fs.writeFile('image-performance-report.json', JSON.stringify(this.results, null, 2));
    console.log('\n📊 Detailed report saved to: image-performance-report.json');
  }

  formatReport() {
    const { summary, images } = this.results;
    const formatBytes = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    let report = '\n🖼️  IMAGE PERFORMANCE ANALYSIS\n';
    report += '=' .repeat(50) + '\n\n';

    // Summary
    report += '📊 SUMMARY:\n';
    report += `  Total Images: ${summary.totalImages}\n`;
    report += `  Total Size: ${formatBytes(summary.totalSize)}\n`;
    
    if (summary.compressionRatio > 0) {
      report += `  Compression Savings: ${summary.compressionRatio}%\n`;
      report += `  Original Size: ${formatBytes(summary.totalSize + summary.optimizedSize)}\n`;
      report += `  Optimized Size: ${formatBytes(summary.optimizedSize)}\n`;
    }
    
    if (summary.largestImage) {
      report += `  Largest Image: ${summary.largestImage.path} (${formatBytes(summary.largestImage.size)})\n`;
    }
    
    report += '\n📁 FORMATS BREAKDOWN:\n';
    Object.entries(summary.formats).forEach(([format, info]) => {
      const avgSize = info.totalSize / info.count;
      report += `  ${format.toUpperCase()}: ${info.count} files, ${formatBytes(info.totalSize)} total, ${formatBytes(avgSize)} avg\n`;
    });

    // Optimization opportunities
    report += '\n💡 OPTIMIZATION OPPORTUNITIES:\n';
    
    const pngImages = images.filter(img => img.format === 'png');
    if (pngImages.length > 0) {
      report += `  • Found ${pngImages.length} PNG files that could be converted to WebP/AVIF\n`;
    }
    
    const largeImages = images.filter(img => img.size > 500 * 1024); // > 500KB
    if (largeImages.length > 0) {
      report += `  • Found ${largeImages.length} images larger than 500KB\n`;
    }
    
    const unoptimizedImages = images.filter(img => 
      !img.path.includes('/img/optimized/') && 
      img.path.includes('/img/') &&
      (img.format === 'jpg' || img.format === 'png')
    );
    if (unoptimizedImages.length > 0) {
      report += `  • Found ${unoptimizedImages.length} images that could be optimized\n`;
    }

    // Individual image details
    report += '\n📋 IMAGE DETAILS:\n';
    images
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((img, index) => {
        const dimensions = img.width && img.height ? `${img.width}x${img.height}` : 'unknown';
        report += `  ${index + 1}. ${img.path} (${formatBytes(img.size)}, ${img.format.toUpperCase()}, ${dimensions})\n`;
      });

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const buildDir = process.argv[2] || '_site';
  const analyzer = new ImagePerformanceAnalyzer();
  analyzer.analyzeBuildDirectory(buildDir);
}

module.exports = ImagePerformanceAnalyzer;
