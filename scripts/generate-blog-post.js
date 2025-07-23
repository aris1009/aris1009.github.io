#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const LANGUAGES = ['en-us', 'el', 'tr'];
const LOCALE_MAP = {
  'en-us': 'en-us',
  'el': 'el',
  'tr': 'tr'
};

const BLOG_DIR = path.join(__dirname, '..', 'src', 'blog');

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Create placeholder content for any language
function createPlaceholderContent(lang, slug, title = '', description = '', keywords = '') {
  const placeholderMessages = {
    'en-us': {
      title: 'Translation Not Available',
      content: 'This post has not been translated to English yet. It may be available in other languages. You can help translate it or check back later.'
    },
    'el': {
      title: 'Μετάφραση Μη Διαθέσιμη',
      content: 'Αυτή η ανάρτηση δεν έχει μεταφραστεί ακόμη στα ελληνικά. Μπορεί να είναι διαθέσιμη σε άλλες γλώσσες. Μπορείτε να βοηθήσετε στη μετάφρασή της ή να ελέγξετε ξανά αργότερα.'
    },
    'tr': {
      title: 'Çeviri Mevcut Değil',
      content: 'Bu yazı henüz Türkçeye çevrilmemiştir. Diğer dillerde mevcut olabilir. Çevirisine yardımcı olabilir veya daha sonra tekrar kontrol edebilirsiniz.'
    }
  };

  const placeholder = placeholderMessages[lang];
  const currentDate = getCurrentDate();
  
  return `---
layout: article.njk
title: "${title || placeholder.title}"
description: "${description || 'This post has not been translated yet.'}"
date: ${currentDate}
keyword: ${keywords}
type: article
locale: ${LOCALE_MAP[lang]}
permalink: /blog/${LOCALE_MAP[lang]}/${slug}/
draft: true
---

${title ? `# ${title}\n\n[Write your content here...]` : placeholder.content}
`;
}

// Create template content for the first post
function createTemplateContent(lang, slug, title, description = '', keywords = '') {
  const currentDate = getCurrentDate();
  
  return `---
layout: article.njk
title: "${title}"
description: "${description || 'Add your description here'}"
date: ${currentDate}
keyword: ${keywords || 'add, your, keywords, here'}
type: article
locale: ${LOCALE_MAP[lang]}
permalink: /blog/${LOCALE_MAP[lang]}/${slug}/
---

# ${title}

[Write your content here...]

## Section 1

[Add your content...]

## Section 2

[Add your content...]

## Conclusion

[Add your conclusion...]
`;
}

// Main function
function generateBlogPost(slug, title, description, keywords) {
  if (!slug) {
    console.error('Usage: npm run new-post <slug> [title] [description] [keywords]');
    console.error('Example: npm run new-post my-new-blog-post "My Blog Post Title" "Brief description" "security,tech"');
    console.error('');
    console.error('If title is provided, it will be used for the first language file created.');
    console.error('Other languages will get placeholder content with translation notices.');
    process.exit(1);
  }

  console.log(`Creating new blog post: ${slug}`);
  if (title) {
    console.log(`Title: ${title}`);
  }

  let createdCount = 0;
  let firstLanguageCreated = false;

  // Generate versions for all languages
  for (const lang of LANGUAGES) {
    const langDir = path.join(BLOG_DIR, lang);
    const postPath = path.join(langDir, `${slug}.md`);
    
    // Create language directory if it doesn't exist
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`Created directory: ${langDir}`);
    }
    
    // Skip if file already exists
    if (fs.existsSync(postPath)) {
      console.log(`${lang.toUpperCase()} version already exists, skipping: ${postPath}`);
      continue;
    }
    
    let content;
    
    // If title is provided and this is the first file we're creating, use template
    // Otherwise, use placeholder content
    if (title && !firstLanguageCreated) {
      content = createTemplateContent(lang, slug, title, description, keywords);
      firstLanguageCreated = true;
      console.log(`Created ${lang.toUpperCase()} template with title: ${postPath}`);
    } else {
      content = createPlaceholderContent(lang, slug, '', description, keywords);
      console.log(`Created ${lang.toUpperCase()} placeholder: ${postPath}`);
    }
    
    // Write file
    fs.writeFileSync(postPath, content, 'utf8');
    createdCount++;
  }
  
  if (createdCount === 0) {
    console.log('All language versions already exist for this slug.');
    return;
  }
  
  console.log('\nDone! Blog post files created.');
  
  if (title) {
    console.log(`\nOne file contains your title "${title}" ready for writing.`);
    console.log('Other files contain translation placeholders.');
  } else {
    console.log('\nAll files contain placeholder content.');
    console.log('Edit any file to write your post, then others will show translation notices.');
  }
  
  console.log('\nNext steps:');
  console.log('1. Write your blog post in your preferred language');
  console.log('2. Translate to other languages when ready');
  console.log('3. Run: npm run build');
}

// Run the script
const [,, slug, title, description, keywords] = process.argv;
generateBlogPost(slug, title, description, keywords);