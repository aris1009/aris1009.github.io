---
pagination:
  data: supportedLocales
  size: 1
  alias: locale
layout: page.njk
permalink: "{% if locale == 'en-us' %}index.html{% else %}{{ locale }}/index.html{% endif %}"
---

# {{ 'home.heading' | i18n }}

{{ 'home.welcome' | i18n }}

## {{ 'home.latestPosts' | i18n }}

<div class="prose max-w-none">
{% if locale == 'el' %}
  {% set posts = collections.postsEl %}
{% elif locale == 'tr' %}
  {% set posts = collections.postsTr %}
{% else %}
  {% set posts = collections.postsEn_us %}
{% endif %}
{% for post in posts %}
<article class="mb-8 pb-8 border-b border-gray-200" role="article" aria-labelledby="post-{{ loop.index }}-title">
  <h3 class="text-xl font-semibold mb-2" id="post-{{ loop.index }}-title">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800">{{ post.data.title }}</a>
  </h3>
  <div class="text-gray-600 text-sm mb-3">
    <time datetime="{{ post.date | htmlDateString }}">{{ post.date | readableDate }}</time>
  </div>
  <p class="text-gray-700">{{ post.data.description }}</p>
  <div class="mt-3">
    <a href="{{ post.url }}" class="text-blue-600 hover:text-blue-800 font-medium" aria-label="Read full article: {{ post.data.title }}">{{ 'home.readMore' | i18n }}</a>
  </div>
</article>
{% endfor %}
</div>