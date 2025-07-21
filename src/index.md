---
title: Home
layout: page.njk
keyword: security, cybersecurity, technology, blog
permalink: "index.html"
---

# Security & Technology Blog

Welcome to my blog about cybersecurity, technology, and digital privacy. Here I share insights, analysis, and practical advice to help you stay secure in the digital world.

## Latest Posts

<div class="prose max-w-none">
{% for post in collections.posts_en_us %}
<article class="mb-8 pb-8 border-b border-gray-200">
  <h3 class="text-xl font-semibold mb-2">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800">{{ post.data.title }}</a>
  </h3>
  <div class="text-gray-600 text-sm mb-3">{{ post.date | readableDate: post.data.locale }}</div>
  <p class="text-gray-700">{{ post.data.description }}</p>
  <div class="mt-3">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800 font-medium">Read more →</a>
  </div>
</article>
{% endfor %}
</div>