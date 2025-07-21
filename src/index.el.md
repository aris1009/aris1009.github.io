---
title: Αρχική
layout: page.njk
keyword: ασφάλεια, κυβερνοασφάλεια, τεχνολογία, ιστολόγιο
permalink: "el/index.html"
locale: el
---

# Ιστολόγιο Ασφάλειας & Τεχνολογίας

Καλώς ήρθατε στο ιστολόγιό μου για την κυβερνοασφάλεια, την τεχνολογία και την ψηφιακή ιδιωτικότητα. Εδώ μοιράζομαι γνώσεις, αναλύσεις και πρακτικές συμβουλές για να σας βοηθήσω να παραμείνετε ασφαλείς στον ψηφιακό κόσμο.

## Τελευταίες Αναρτήσεις

<div class="prose max-w-none">
{% for post in collections.posts_el %}
<article class="mb-8 pb-8 border-b border-gray-200">
  <h3 class="text-xl font-semibold mb-2">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800">{{ post.data.title }}</a>
  </h3>
  <div class="text-gray-600 text-sm mb-3">{{ post.date | readableDate: post.data.locale }}</div>
  <p class="text-gray-700">{{ post.data.description }}</p>
  <div class="mt-3">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800 font-medium">Διαβάστε περισσότερα →</a>
  </div>
</article>
{% endfor %}
</div>