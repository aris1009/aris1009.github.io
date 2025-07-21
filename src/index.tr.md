---
title: Ana Sayfa
layout: page.njk
keyword: güvenlik, siber güvenlik, teknoloji, blog
permalink: "tr/index.html"
locale: tr
---

# Güvenlik & Teknoloji Blogu

Siber güvenlik, teknoloji ve dijital gizlilik hakkındaki bloguma hoş geldiniz. Burada dijital dünyada güvende kalmanıza yardımcı olmak için içgörüler, analizler ve pratik tavsiyeler paylaşıyorum.

## Son Yazılar

<div class="prose max-w-none">
{% for post in collections.posts_tr %}
<article class="mb-8 pb-8 border-b border-gray-200">
  <h3 class="text-xl font-semibold mb-2">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800">{{ post.data.title }}</a>
  </h3>
  <div class="text-gray-600 text-sm mb-3">{{ post.date | readableDate: post.data.locale }}</div>
  <p class="text-gray-700">{{ post.data.description }}</p>
  <div class="mt-3">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800 font-medium">Devamını oku →</a>
  </div>
</article>
{% endfor %}
</div>